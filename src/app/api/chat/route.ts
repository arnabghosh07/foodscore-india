import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured on the server.' },
        { status: 500 }
      );
    }

    const { message, history, productContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 }
      );
    }

    // Initialize the Gemini SDK
    const ai = new GoogleGenerativeAI(apiKey);
    
    // Format the system instruction and product context
    const productName = productContext?.product_name || 'this product';
    const brand = productContext?.brands || 'Unknown Brand';
    const score = productContext?.overallScore ?? 'unknown';
    const grade = productContext?.grade ?? 'unknown';
    const redFlagsText = productContext?.safetyRecommendation?.redFlags?.length > 0
      ? productContext.safetyRecommendation.redFlags.join(', ')
      : 'None';
    const warningsText = productContext?.warnings?.length > 0
      ? productContext.warnings.join(', ')
      : 'None';

    const systemInstruction = 
      `You are "FoodScore AI", a friendly and helpful nutritionist assistant for the FoodScore India mobile app.\n` +
      `Your goal is to answer the user's questions about food products and health in a simple, engaging way.\n\n` +
      `Current scanned product context:\n` +
      `- Product: ${productName} (Brand: ${brand})\n` +
      `- Health Score: ${score}/100 (Grade: ${grade})\n` +
      `- Red Flags: ${redFlagsText}\n` +
      `- Warnings: ${warningsText}\n\n` +
      `Guidelines for your response:\n` +
      `1. Be concise: Keep your response under 3-4 sentences maximum. Users are reading this on mobile.\n` +
      `2. Adapt to the Indian context: Mention typical Indian eating habits, ingredients, or dietary habits when relevant.\n` +
      `3. Be safe: NEVER prescribe medicines, diagnose specific illnesses, or tell users to ignore doctor recommendations. If asked for medical prescriptions, strictly decline and refer them to a doctor.\n` +
      `4. Tone: Helpful, positive, and educational.\n` +
      `5. ALWAYS end your response with this short disclaimer: "⚠️ AI info; not medical advice."`;

    // Using gemini-2.5-flash for speed and reliability
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction
    });

    // Map history to Gemini API format
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.content }]
        });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
        // @ts-ignore - thinkingConfig is supported but might not be in the local typings file yet
        thinkingConfig: {
          thinkingBudget: 0,
        },
      }
    });

    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[api/chat] Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again later.' },
      { status: 500 }
    );
  }
}
