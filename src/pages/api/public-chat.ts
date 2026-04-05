import type { APIRoute } from "astro";
import {
  buildLocalFaqReply,
  buildPortfolioContext,
  defaultQuestionSuggestions,
} from "@/lib/chatbot/portfolio-knowledge";

export const prerender = false;

type ChatRole = "user" | "assistant";

interface ChatTurn {
  role: ChatRole;
  content: string;
}

interface ProviderResult {
  provider: string;
  reply: string;
}

interface CacheEntry {
  reply: string;
  sourceProvider: string;
  expiresAt: number;
}

const SYSTEM_PROMPT = [
  "You are Portfolio Assistant for Muhammad Fikri Haikal.",
  "Answer in Indonesian by default unless the user writes in English.",
  "Use only factual information from PORTFOLIO_FACTS.",
  "Reject requests outside portfolio scope (math, trivia, generic coding, unrelated personal advice) and redirect to portfolio questions.",
  "Never invent biography details, education history, companies, project results, or personal data outside PORTFOLIO_FACTS.",
  "If information is missing, clearly say it is not available in portfolio data and offer contact details from PORTFOLIO_FACTS.",
  "Keep responses concise, practical, and in a natural chat style.",
].join(" ");

const PORTFOLIO_CONTEXT = buildPortfolioContext();

const REQUEST_TIMEOUT_MS = 18000;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_ITEMS = 8;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 30;
const CACHE_TTL_MS = 30 * 60_000;
const CACHE_MAX_ITEMS = 300;

const requestCounter = new Map<string, { count: number; resetAt: number }>();
const responseCache = new Map<string, CacheEntry>();

const PORTFOLIO_SCOPE_KEYWORDS = [
  "haikal",
  "fikri",
  "muhammad",
  "portfolio",
  "portofolio",
  "profil",
  "profile",
  "tentang",
  "about",
  "project",
  "proyek",
  "karya",
  "skill",
  "keahlian",
  "tech stack",
  "stack",
  "pengalaman",
  "experience",
  "internship",
  "magang",
  "kerja",
  "pekerjaan",
  "kolaborasi",
  "kerjasama",
  "kerja sama",
  "hire",
  "freelance",
  "layanan",
  "jasa",
  "services",
  "kontak",
  "contact",
  "email",
  "linkedin",
  "github",
  "instagram",
  "sertifikat",
  "certification",
  "toeic",
  "dicoding",
  "lokasi",
  "domisili",
  "remote",
  "wfo",
  "hybrid",
  "cv",
  "resume",
];

const FOLLOW_UP_KEYWORDS = [
  "jelasin",
  "jelaskan",
  "lebih detail",
  "lanjut",
  "contoh",
  "bagaimana",
  "kenapa",
  "berapa",
  "kapan",
  "dimana",
  "yang mana",
  "itu",
];

const GREETING_KEYWORDS = [
  "halo",
  "hai",
  "hi",
  "hello",
  "assalamualaikum",
  "permisi",
  "p",
  "selamat pagi",
  "selamat siang",
  "selamat sore",
  "selamat malam",
];

const toText = (input: unknown, maxLength = MAX_MESSAGE_LENGTH): string => {
  if (typeof input !== "string") {
    return "";
  }
  return input.replace(/\s+/g, " ").trim().slice(0, maxLength);
};

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
};

const consumeRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const current = requestCounter.get(ip);

  if (!current || now >= current.resetAt) {
    requestCounter.set(ip, {
      count: 1,
      resetAt: now + RATE_WINDOW_MS,
    });
    return true;
  }

  if (current.count >= RATE_LIMIT_PER_WINDOW) {
    return false;
  }

  current.count += 1;
  requestCounter.set(ip, current);
  return true;
};

const requestJson = async (
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<any> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    const bodyText = await response.text();
    let body: any = null;

    try {
      body = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      body = null;
    }

    if (!response.ok) {
      const message =
        (body && (body.error?.message || body.error || body.message)) ||
        `HTTP ${response.status}`;
      throw new Error(String(message));
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeHistory = (rawHistory: unknown): ChatTurn[] => {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  const cleaned = rawHistory
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const role = (item as any).role;
      const content = toText((item as any).content);

      if ((role !== "user" && role !== "assistant") || !content) {
        return null;
      }

      return { role, content } as ChatTurn;
    })
    .filter((item): item is ChatTurn => item !== null);

  return cleaned.slice(-MAX_HISTORY_ITEMS);
};

const normalizeForCache = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const hasAnyKeyword = (text: string, keywords: string[]): boolean => {
  return keywords.some((keyword) => text.includes(keyword));
};

const isGreetingOnly = (message: string): boolean => {
  const normalized = normalizeForCache(message);
  if (!normalized) {
    return false;
  }

  return GREETING_KEYWORDS.some((greeting) => normalized === greeting || normalized.startsWith(`${greeting} `));
};

const isPortfolioScoped = (message: string, history: ChatTurn[]): boolean => {
  const normalizedMessage = normalizeForCache(message);
  if (!normalizedMessage) {
    return false;
  }

  if (isGreetingOnly(normalizedMessage)) {
    return true;
  }

  if (hasAnyKeyword(normalizedMessage, PORTFOLIO_SCOPE_KEYWORDS)) {
    return true;
  }

  const hasFollowUpIntent = hasAnyKeyword(normalizedMessage, FOLLOW_UP_KEYWORDS);
  if (!hasFollowUpIntent) {
    return false;
  }

  const recentHistory = history.slice(-4);
  return recentHistory.some((item) => hasAnyKeyword(normalizeForCache(item.content), PORTFOLIO_SCOPE_KEYWORDS));
};

const buildOutOfScopeReply = (): string => {
  return [
    "Maaf, saya hanya bisa menjawab hal yang terkait portfolio Muhammad Fikri Haikal.",
    "Silakan pilih pertanyaan yang relevan, misalnya:",
    `1) ${defaultQuestionSuggestions[0]}`,
    `2) ${defaultQuestionSuggestions[1]}`,
    `3) ${defaultQuestionSuggestions[2]}`,
    `4) ${defaultQuestionSuggestions[3]}`,
    `5) ${defaultQuestionSuggestions[4]}`,
    `6) ${defaultQuestionSuggestions[5]}`,
  ].join("\n");
};

const buildCacheKey = (message: string): string => {
  return normalizeForCache(message).slice(0, 280);
};

const getCachedReply = (cacheKey: string): CacheEntry | null => {
  const entry = responseCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }

  responseCache.delete(cacheKey);
  responseCache.set(cacheKey, entry);
  return entry;
};

const setCachedReply = (cacheKey: string, reply: string, sourceProvider: string): void => {
  const now = Date.now();

  for (const [key, value] of responseCache) {
    if (now >= value.expiresAt) {
      responseCache.delete(key);
    }
  }

  if (responseCache.size >= CACHE_MAX_ITEMS) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }

  responseCache.set(cacheKey, {
    reply,
    sourceProvider,
    expiresAt: now + CACHE_TTL_MS,
  });
};

const asOpenAiMessages = (history: ChatTurn[], message: string) => {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `PORTFOLIO_FACTS:\n${PORTFOLIO_CONTEXT}` },
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: "user", content: message },
  ];
};

const callGroq = async (messages: Array<{ role: string; content: string }>): Promise<ProviderResult> => {
  const apiKey = import.meta.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Groq API key tidak dikonfigurasi.");
  }

  const model = import.meta.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const data = await requestJson("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 500,
      messages,
    }),
  });

  const reply = toText(data?.choices?.[0]?.message?.content, 5000);
  if (!reply) {
    throw new Error("Groq tidak mengembalikan jawaban.");
  }

  return { provider: "groq", reply };
};

const callOpenRouter = async (
  messages: Array<{ role: string; content: string }>
): Promise<ProviderResult> => {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key tidak dikonfigurasi.");
  }

  const model = import.meta.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || "http://localhost:4321";

  const data = await requestJson("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-Title": "Portfolio Chatbot",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
    }),
  });

  const reply = toText(data?.choices?.[0]?.message?.content, 5000);
  if (!reply) {
    throw new Error("OpenRouter tidak mengembalikan jawaban.");
  }

  return { provider: "openrouter", reply };
};

const callGemini = async (
  messages: Array<{ role: string; content: string }>
): Promise<ProviderResult> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key tidak dikonfigurasi.");
  }

  const model = import.meta.env.GEMINI_MODEL || "gemini-1.5-flash";
  const promptText = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  const data = await requestJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
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
                text: promptText,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  const reply = toText(data?.candidates?.[0]?.content?.parts?.[0]?.text, 5000);
  if (!reply) {
    throw new Error("Gemini tidak mengembalikan jawaban.");
  }

  return { provider: "gemini", reply };
};

const callCloudflare = async (
  messages: Array<{ role: string; content: string }>
): Promise<ProviderResult> => {
  const apiToken = import.meta.env.CLOUDFLARE_API_TOKEN;
  const accountId = import.meta.env.CLOUDFLARE_ACCOUNT_ID;
  if (!apiToken || !accountId) {
    throw new Error("Cloudflare token/account belum dikonfigurasi.");
  }

  const model = import.meta.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";

  const data = await requestJson(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        messages,
      }),
    }
  );

  const possibleReply =
    typeof data?.result === "string"
      ? data.result
      : data?.result?.response || data?.result?.text || data?.response;

  const reply = toText(possibleReply, 5000);
  if (!reply) {
    throw new Error("Cloudflare AI tidak mengembalikan jawaban.");
  }

  return { provider: "cloudflare" as const, reply };
};

export const POST: APIRoute = async ({ request }) => {
  let message = "";
  let history: ChatTurn[] = [];

  try {
    const payload = await request.json();
    message = toText(payload?.message);
    history = normalizeHistory(payload?.history);
  } catch {
    return Response.json(
      {
        error: "Body request tidak valid.",
      },
      { status: 400 }
    );
  }

  if (!message) {
    return Response.json(
      {
        error: "Pesan tidak boleh kosong.",
      },
      { status: 400 }
    );
  }

  const cacheKey = buildCacheKey(message);

  if (!isPortfolioScoped(message, history)) {
    const outOfScopeReply = buildOutOfScopeReply();
    setCachedReply(cacheKey, outOfScopeReply, "scope");

    return Response.json({
      reply: outOfScopeReply,
      provider: "scope",
    });
  }

  const cachedReply = getCachedReply(cacheKey);
  if (cachedReply) {
    return Response.json({
      reply: cachedReply.reply,
      provider: "cache",
      cachedProvider: cachedReply.sourceProvider,
    });
  }

  const localFaqReply = buildLocalFaqReply(message);
  if (localFaqReply) {
    setCachedReply(cacheKey, localFaqReply, "local");
    return Response.json({
      reply: localFaqReply,
      provider: "local",
    });
  }

  const ip = getClientIp(request);
  if (!consumeRateLimit(ip)) {
    return Response.json(
      {
        error: "Terlalu banyak request. Coba lagi sebentar.",
      },
      { status: 429 }
    );
  }

  const messages = asOpenAiMessages(history, message);

  const providers: Array<() => Promise<ProviderResult>> = [
    () => callGroq(messages),
    () => callOpenRouter(messages),
    () => callGemini(messages),
    () => callCloudflare(messages),
  ];

  const providerErrors: string[] = [];

  for (const provider of providers) {
    try {
      const result = await provider();
      setCachedReply(cacheKey, result.reply, result.provider);
      return Response.json({
        reply: result.reply,
        provider: result.provider,
      });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Provider error";
      providerErrors.push(messageText);
    }
  }

  return Response.json(
    {
      error: "Semua AI provider sedang gagal. Coba lagi beberapa saat.",
      details: providerErrors,
    },
    { status: 502 }
  );
};
