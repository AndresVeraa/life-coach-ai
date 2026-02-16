import { ENV } from '@/constants/config';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  tokensUsed?: number;
}

/**
 * Servicio de IA - Soporta OpenAI o Gemini
 * Usa la variable ENV para detectar qué API está configurada
 */

async function callOpenAI(messages: AIMessage[]): Promise<AIResponse> {
  if (!ENV.OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key no configurada',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `OpenAI Error: ${errorData.error?.message || 'Unknown error'}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens;

    if (!content) {
      return {
        success: false,
        error: 'No response from OpenAI',
      };
    }

    return {
      success: true,
      content,
      tokensUsed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `OpenAI request failed: ${errorMessage}`,
    };
  }
}

async function callGemini(messages: AIMessage[]): Promise<AIResponse> {
  if (!ENV.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'Gemini API key no configurada',
    };
  }

  try {
    // Convertir formato OpenAI a Gemini
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ENV.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.9,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `Gemini Error: ${errorData.error?.message || 'Unknown error'}`,
      };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return {
        success: false,
        error: 'No response from Gemini',
      };
    }

    return {
      success: true,
      content,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Gemini request failed: ${errorMessage}`,
    };
  }
}

/**
 * Función principal con retry logic
 */
export async function callAI(
  messages: AIMessage[],
  retries: number = 3
): Promise<AIResponse> {
  // Detectar qué API usar basado en keys configuradas
  const useGemini = ENV.GEMINI_API_KEY && !ENV.OPENAI_API_KEY;
  const useOpenAI = ENV.OPENAI_API_KEY && !ENV.GEMINI_API_KEY;

  if (!useOpenAI && !useGemini) {
    return {
      success: false,
      error: 'No AI API key configured. Set EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY in .env',
    };
  }

  let lastError: AIResponse | null = null;

  for (let i = 0; i < retries; i++) {
    const result = useGemini ? await callGemini(messages) : await callOpenAI(messages);

    if (result.success) {
      return result;
    }

    lastError = result;

    // Exponential backoff: 2s, 4s, 8s
    if (i < retries - 1) {
      const delayMs = Math.pow(2, i + 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return lastError || {
    success: false,
    error: 'AI request failed after retries',
  };
}

/**
 * EJEMPLO DE USO:
 * 
 * const response = await callAI([
 *   { role: 'user', content: 'Hola, ¿cómo estás?' }
 * ]);
 * 
 * if (response.success) {
 *   console.log(response.content);
 * } else {
 *   console.error(response.error);
 * }
 */
