import type { APIRoute } from "astro";

export const prerender = false;

// Google Translate single text helper
async function translateToIndonesian(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || !/[a-zA-Z]/.test(trimmed)) {
    return text;
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(trimmed)}`;
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { texts, targetLang } = body as { texts: string[]; targetLang: string };

    if (!Array.isArray(texts) || texts.length === 0) {
      return Response.json({ translations: [] });
    }

    // Deduplicate texts to optimize API calls
    const uniqueTexts = Array.from(new Set(texts.map(t => t.trim()).filter(Boolean)));
    const translationMap = new Map<string, string>();

    // If target language is 'en', we assume source is English and we don't translate
    if (targetLang === "en") {
      const translations = texts.map(t => t);
      return Response.json({ translations });
    }

    const apiKey = import.meta.env.GEMINI_API_KEY;
    let geminiSucceeded = false;

    if (apiKey && uniqueTexts.length > 0) {
      try {
        const model = import.meta.env.GEMINI_MODEL || "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const systemPrompt = "You are a professional translator. Translate the following array of English strings into natural Indonesian. Return ONLY a JSON array of strings in the exact same order. Do not include any markdown styling (such as ```json) or notes/explanations.";
        
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
                    text: `${systemPrompt}\n\nStrings to translate:\n${JSON.stringify(uniqueTexts)}`
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
          const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            const translatedArray = JSON.parse(textResponse.trim()) as string[];
            if (Array.isArray(translatedArray) && translatedArray.length === uniqueTexts.length) {
              uniqueTexts.forEach((original, index) => {
                translationMap.set(original, translatedArray[index] || original);
              });
              geminiSucceeded = true;
            }
          }
        }
      } catch (e) {
        console.error("Gemini batch translation API call failed:", e);
      }
    }

    // Fallback: Google Translate API in parallel
    if (!geminiSucceeded && uniqueTexts.length > 0) {
      try {
        const translatePromises = uniqueTexts.map(async (text) => {
          const translated = await translateToIndonesian(text);
          translationMap.set(text, translated);
        });
        await Promise.all(translatePromises);
      } catch (e) {
        console.error("Google Translate fallback failed:", e);
      }
    }

    // Map translated values back to original list preserving duplicates and order
    const translations = texts.map((original) => {
      const trimmed = original.trim();
      if (!trimmed) return original;
      return translationMap.get(trimmed) || original;
    });

    return Response.json({ translations });
  } catch (error) {
    console.error("Error in translation API route:", error);
    return Response.json({ error: "Internal translation error" }, { status: 500 });
  }
};
