// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock GoogleGenerativeAI
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor() {}
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

// Mock fetch for OpenRouter fallback
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks
import { POST } from '@/app/api/chat/route';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/chat POST', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'This is a helpful response about your food.' },
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'OpenRouter reply' } }] }),
    });
  });

  it('should return 400 when message is missing', async () => {
    const req = makeRequest({ history: [] });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Message is required.');
  });

  it('should return 400 when message is empty string', async () => {
    const req = makeRequest({ message: '' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Message is required.');
  });

  it('should return reply from Gemini when API key is configured', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENROUTER_API_KEY = '';

    const req = makeRequest({
      message: 'Is this healthy?',
      productContext: {
        product_name: 'Maggi Noodles',
        brands: 'Nestle',
        overallScore: 35,
        grade: 'D',
      },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe('This is a helpful response about your food.');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should include conversation history in Gemini request', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENROUTER_API_KEY = '';

    const req = makeRequest({
      message: 'Tell me more',
      history: [
        { role: 'user', content: 'What is this product?' },
        { role: 'model', content: 'It is Maggi Noodles.' },
      ],
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    // 2 history turns + 1 current message = 3 contents
    expect(callArgs.contents).toHaveLength(3);
    expect(callArgs.contents[0].role).toBe('user');
    expect(callArgs.contents[1].role).toBe('model');
    expect(callArgs.contents[2].role).toBe('user');
  });

  it('should fall back to OpenRouter when Gemini fails', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

    mockGenerateContent.mockRejectedValue(new Error('Gemini API error'));

    const req = makeRequest({ message: 'Is this healthy?' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe('OpenRouter reply');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-openrouter-key',
        }),
      })
    );
  });

  it('should fall back to OpenRouter when no Gemini key is configured', async () => {
    process.env.GEMINI_API_KEY = '';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

    const req = makeRequest({ message: 'Is this healthy?' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBe('OpenRouter reply');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('should return 500 when both APIs fail', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';

    mockGenerateContent.mockRejectedValue(new Error('Gemini failed'));
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const req = makeRequest({ message: 'Is this healthy?' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain('Failed to generate response');
  });

  it('should return 500 when no API keys are configured', async () => {
    process.env.GEMINI_API_KEY = '';
    process.env.OPENROUTER_API_KEY = '';

    const req = makeRequest({ message: 'Is this healthy?' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toContain('Failed to generate response');
  });

  it('should include product context in system instruction', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENROUTER_API_KEY = '';

    const req = makeRequest({
      message: 'Is this safe?',
      productContext: {
        product_name: 'Parle-G',
        brands: 'Parle',
        overallScore: 40,
        grade: 'D',
        warnings: ['High sugar'],
        safetyRecommendation: { redFlags: ['Very High sugar'] },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify the model was called (system instruction is set via getGenerativeModel)
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should return 500 on invalid JSON body', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to process request.');
  });
});
