import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Envía un mensaje a la API de Gemini y recibe una respuesta inteligente
 */
export const sendMessageToGemini = async (message: string): Promise<AIResponse> => {
  if (!API_KEY) {
    console.error('❌ Falta EXPO_PUBLIC_GEMINI_API_KEY en .env');
    return {
      success: false,
      error: 'API Key no configurada. Añade EXPO_PUBLIC_GEMINI_API_KEY a tu .env',
    };
  }

  try {
    const response = await axios.post(GEMINI_URL, {
      contents: [
        {
          parts: [
            {
              text: message,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    // Extraer el texto de la respuesta compleja de Google
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        success: false,
        error: 'Respuesta vacía de Gemini',
      };
    }

    return {
      success: true,
      content: text,
    };
  } catch (error: any) {
    console.error('❌ Error conectando con Gemini:', error.message);

    // Mensajes más útiles según el tipo de error
    let errorMsg = 'Error conectando con Gemini';

    if (error.response?.status === 401) {
      errorMsg = 'API Key inválida. Verifica tu EXPO_PUBLIC_GEMINI_API_KEY en .env';
    } else if (error.response?.status === 429) {
      errorMsg = 'Límite de rate limit alcanzado. Intenta en un momento.';
    } else if (error.message === 'Network Error') {
      errorMsg = 'Sin conexión a internet. Verifica tu red.';
    }

    return {
      success: false,
      error: errorMsg,
    };
  }
};
