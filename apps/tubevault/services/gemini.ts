
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function suggestCategory(videoTitle: string, existingCategories: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The YouTube video title is: "${videoTitle}". 
      Based on this title, suggest the most appropriate category from this list: ${existingCategories.join(', ')}.
      If none fit well, suggest a single new category name.
      Return the result as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["suggestedCategory"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini categorization failed", error);
    return null;
  }
}
