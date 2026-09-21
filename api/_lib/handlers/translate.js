import { GoogleGenAI } from '@google/genai';

function reply(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return reply(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  const targetLang = req.body?.targetLang === 'ar' ? 'Arabic' : 'English';
  if (!text) return reply(res, 400, { error: 'NO_TEXT_PROVIDED' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return reply(res, 503, { error: 'GEMINI_API_KEY_NOT_CONFIGURED' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Translate the following text to ${targetLang}. Return ONLY the translated text without explanations, markdown, or quotation marks.

Original text:
${text}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const translatedText = response.text?.trim() || '';
    if (!translatedText) {
      return reply(res, 502, { error: 'GEMINI_EMPTY_RESPONSE' });
    }
    return reply(res, 200, { translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    const detail = error instanceof Error ? error.message.slice(0, 240) : 'UNKNOWN_ERROR';
    return reply(res, 502, { error: 'GEMINI_TRANSLATION_FAILED', detail });
  }
}
