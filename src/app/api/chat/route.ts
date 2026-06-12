import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, history, productContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 }
      );
    }

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
      `3. Be safe: NEVER prescribe medicines, diagnose specific illnesses, or suggest medical treatments. If the user asks about serious health conditions, disease treatments, prescriptions, or if you are in any way confused or unsure, state clearly that you are an AI and they should consult a doctor or healthcare professional for serious matters.\n` +
      `4. Tone: Helpful, positive, and educational.`;

    let reply = '';
    let success = false;
    let errorDetail = '';

    // 1. Try Gemini API first if configured
    if (apiKey) {
      try {
        const ai = new GoogleGenerativeAI(apiKey);
        
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

        const textResult = result.response.text();
        if (textResult) {
          reply = textResult;
          success = true;
        }
      } catch (geminiError) {
        console.error('[api/chat] Gemini API failed, checking fallback...', geminiError);
        errorDetail = geminiError instanceof Error ? geminiError.message : String(geminiError);
      }
    }

    // 2. Fallback to OpenRouter if Gemini failed or wasn't configured
    if (!success) {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey) {
        try {
          console.log('[api/chat] Attempting OpenRouter fallback...');
          const messages = [
            { role: 'system', content: systemInstruction }
          ];

          if (history && Array.isArray(history)) {
            for (const turn of history) {
              messages.push({
                role: turn.role === 'user' ? 'user' : 'assistant',
                content: turn.content
              });
            }
          }

          messages.push({
            role: 'user',
            content: message
          });

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://foodscore-india.local',
              'X-Title': 'FoodScore India'
            },
            body: JSON.stringify({
              model: 'openrouter/free',
              messages,
              max_tokens: 250, // Limit to prevent 402 budget exhaustion errors
              temperature: 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            const openRouterReply = data.choices?.[0]?.message?.content;
            if (openRouterReply) {
              reply = openRouterReply;
              success = true;
              console.log('[api/chat] OpenRouter fallback succeeded.');
            } else {
              console.error('[api/chat] OpenRouter returned empty response:', data);
            }
          } else {
            const errText = await response.text();
            console.error(`[api/chat] OpenRouter API failed with status ${response.status}:`, errText);
          }
        } catch (openRouterError) {
          console.error('[api/chat] OpenRouter API fetch failed:', openRouterError);
        }
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to generate response. Gemini error: ${errorDetail || 'Not configured'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[api/chat] General error handling POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request.' },
      { status: 500 }
    );
  }
}
