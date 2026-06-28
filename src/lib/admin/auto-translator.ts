import { sourceTranslations } from "./translations-source";

// Memory cache for the merged translation dictionary
let translationCache: Record<string, { en: string; id: string }> | null = null;

export async function getAutoTranslations(): Promise<Record<string, { en: string; id: string }>> {
  if (translationCache) {
    return translationCache;
  }

  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const model = import.meta.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const systemPrompt = "You are a professional translator. Translate the values of the following JSON dictionary from English to Indonesian. Preserve all keys. Return ONLY the translated JSON object. Do not include any markdown formatting (like ```json) or explanation.";
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\nJSON:\n${JSON.stringify(sourceTranslations, null, 2)}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const translatedObj = JSON.parse(text.trim());
          const merged: Record<string, { en: string; id: string }> = {};
          for (const key of Object.keys(sourceTranslations)) {
            merged[key] = {
              en: sourceTranslations[key],
              id: translatedObj[key] || sourceTranslations[key]
            };
          }
          translationCache = merged;
          return translationCache;
        }
      }
    } catch (e) {
      console.error("Gemini translation failed, falling back to Google Translate API:", e);
    }
  }

  // Fallback to free Google Translate API in case Gemini fails or is not configured
  try {
    const merged: Record<string, { en: string; id: string }> = {};
    const keys = Object.keys(sourceTranslations);
    
    const promises = keys.map(async (key) => {
      const englishText = sourceTranslations[key];
      const indonesianText = await translateToIndonesian(englishText);
      merged[key] = {
        en: englishText,
        id: indonesianText
      };
    });

    await Promise.all(promises);
    translationCache = merged;
    return translationCache;
  } catch (e) {
    console.error("All auto-translations failed:", e);
    
    // Ultimate fallback: Indonesian is same as English
    const merged: Record<string, { en: string; id: string }> = {};
    for (const key of Object.keys(sourceTranslations)) {
      merged[key] = {
        en: sourceTranslations[key],
        id: sourceTranslations[key]
      };
    }
    return merged;
  }
}

async function translateToIndonesian(text: string): Promise<string> {
  if (!text || !text.trim() || !/[a-zA-Z]/.test(text)) {
    return text;
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const json = await res.json() as any;
    if (json && json[0]) {
      return json[0].map((part: any) => part[0]).join("");
    }
    return text;
  } catch {
    return text;
  }
}
