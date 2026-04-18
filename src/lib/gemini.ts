import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function translateText(text: string, direction: 'en-uz' | 'uz-en' = 'en-uz') {
  if (!text) return "";

  const prompt = direction === 'en-uz' 
    ? `Siz "Iroda Ustoz AI" ismli ingliz tili o'qituvchisisiz. Quyidagi matnni o'zbek tiliga o'rgatuvchi uslubda tarjima qiling: "${text}". Faqat tarjimani qaytaring.`
    : `Siz "Iroda Ustoz AI" ismli ingliz tili o'qituvchisisiz. Quyidagi o'zbekcha matnni ingliz tiliga tarjima qiling: "${text}". Faqat tarjimani qaytaring.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "Tarjima qilib bo'lmadi.";
  } catch (error) {
    console.error("Translation error:", error);
    return "Xato yuz berdi.";
  }
}

export async function getWordDetails(word: string) {
  const prompt = `Provide the Uzbek translation, phonetic transcription, and an example sentence for the English word "${word}". Return as a JSON object with keys: uzbek, phonetic, example.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Word details error:", error);
    return null;
  }
}

export async function explainGrammar(topic: string) {
  const prompt = `Siz "Iroda Ustoz AI" ismli tajribali ingliz tili o'qituvchisiz. "${topic}" mavzusini o'zbek tilida sodda va tushunarli qilib tushuntirib bering. Qoidalarni sanab o'ting, misollar keltiring va o'quvchiga foydali maslahatlar bering. Javobni Markdown formatida qaytaring.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Grammatikani tushuntirib bo'lmadi.";
  } catch (error) {
    console.error("Grammar explanation error:", error);
    return "Xato yuz berdi.";
  }
}

export async function generateRandomWords() {
  const prompt = `Gimme 6 common but interesting English words for students. For each word, provide: english, uzbek translation, phonetic transcription, and a short example sentence. Return as a JSON array of objects with keys: id (unique), english, uzbek, phonetic, example.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Generate words error:", error);
    return [];
  }
}
