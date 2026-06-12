'use client';

import { useState, useRef, useEffect } from 'react';
import { FoodScoreResult } from '@/lib/types';

interface FoodChatProps {
  result: FoodScoreResult;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function FoodChat({ result }: FoodChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `Hello! I am FoodScore AI 🌿. Ask me anything about **${result.product.product_name || 'this product'}**. For example, you can ask about its ingredients, portion sizes, or how it affects specific health conditions!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setError(null);
    setLoading(true);
    setInput('');
    
    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          // Exclude the initial welcome message from the history to keep context clean
          history: messages.slice(1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          productContext: {
            product_name: result.product.product_name,
            brands: result.product.brands,
            overallScore: result.overallScore,
            grade: result.grade,
            warnings: result.warnings,
            safetyRecommendation: result.safetyRecommendation,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'model', content: data.reply }]);
    } catch (err: any) {
      console.error('[FoodChat] Chat failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const quickQuestions = [
    'Is this safe for children?',
    'What are the main health risks?',
    'Why is it graded this way?',
    'What are some healthy swaps?',
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/25">
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Ask FoodScore AI</h3>
          <p className="text-xxs text-gray-400">Powered by Gemini 1.5 Flash</p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto px-1 py-2 space-y-3 scrollbar-thin">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white font-medium rounded-tr-none shadow-sm'
                  : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.role === 'model' ? (
                // Safe basic markdown parsing for bold text
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />') 
                  }} 
                />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {error && (
          <div className="text-center py-1 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xxs font-medium">
            ⚠️ {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      {messages.length === 1 && !loading && (
        <div className="space-y-1.5">
          <span className="text-xxs font-semibold text-gray-400 uppercase tracking-wider block">Suggested Questions</span>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q)}
                className="px-2.5 py-1.5 bg-emerald-50/50 hover:bg-emerald-100/50 border border-emerald-100/40 text-emerald-800 rounded-xl text-xxs font-medium transition active:scale-[0.98]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50/50 border border-amber-100/40 rounded-xl p-2.5 flex items-start gap-2">
        <span className="text-amber-600 text-xs mt-0.5">⚖️</span>
        <p className="text-xxs text-amber-700 leading-normal font-medium">
          FoodScore AI is for general educational info only. It is not a doctor and cannot replace medical advice, diagnoses, or prescriptions.
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 transition active:scale-[0.98] flex items-center justify-center"
        >
          Send
        </button>
      </form>
    </div>
  );
}
