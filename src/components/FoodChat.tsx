'use client';

import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { FoodScoreResult } from '@/lib/types';

interface FoodChatProps {
  result: FoodScoreResult;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function FoodChat({ result }: FoodChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset chat whenever a new product is scanned
  useEffect(() => {
    setMessages([
      {
        role: 'model',
        content: `Hello! I am FoodScore AI 🌿. Ask me anything about **${result.product.product_name || 'this product'}**. For example, you can ask about its ingredients, portion sizes, or how it affects specific health conditions!`,
      },
    ]);
    setError(null);
    setLoading(false);
  }, [result]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, loading, isOpen]);

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
    } catch (err: unknown) {
      console.error('[FoodChat] Chat failed:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 mb-4 flex flex-col overflow-hidden pointer-events-auto transition-all duration-300 transform scale-100 origin-bottom-right h-[480px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-600 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white leading-tight">FoodScore AI</h3>
                <p className="text-[10px] text-emerald-100/90 font-medium truncate max-w-[180px] sm:max-w-[240px]">
                  Analyzing {result.product.product_name || 'Product'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 text-emerald-100 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'model' ? (
                    <div className="prose prose-xs max-w-none prose-p:my-1 prose-strong:text-inherit prose-strong:font-semibold">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {error && (
              <div className="text-center py-2 px-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xxs font-medium">
                ⚠️ {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Controls / Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 space-y-2.5">
            {/* Quick Action Chips (only shown at starting state) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Suggested Questions</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(q)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100/50 text-emerald-800 rounded-xl text-[10px] font-semibold transition active:scale-[0.98] cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50/60 border border-amber-100/50 rounded-xl p-2 flex items-start gap-1.5">
              <span className="text-amber-600 text-xs">⚖️</span>
              <p className="text-[9px] text-amber-700 leading-normal font-medium">
                AI info; not medical advice, prescriptions, or diagnoses.
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
                className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 transition active:scale-[0.98] flex items-center justify-center cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3.5 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/35 transition-all duration-300 hover:scale-105 active:scale-95 pointer-events-auto cursor-pointer group relative"
        aria-label="Toggle Chat"
      >
        {isOpen ? (
          <>
            <svg className="w-5 h-5 transition-transform duration-300 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs font-bold tracking-wider">CLOSE</span>
          </>
        ) : (
          <>
            <div className="relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-emerald-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-emerald-500 rounded-full" />
            </div>
            <span className="text-xs font-black tracking-wider">ASK AI</span>
          </>
        )}
      </button>
    </div>
  );
}
