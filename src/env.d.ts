/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly PUBLIC_SITE_URL?: string;
	readonly DB_HOST: string;
	readonly DB_PORT?: string;
	readonly DB_USER: string;
	readonly DB_PASSWORD: string;
	readonly DB_NAME: string;
	readonly DB_CONNECTION_LIMIT?: string;
	readonly ADMIN_SESSION_COOKIE_NAME?: string;
	readonly ADMIN_SESSION_TTL_HOURS?: string;
	readonly GROQ_API_KEY?: string;
	readonly GROQ_MODEL?: string;
	readonly OPENROUTER_API_KEY?: string;
	readonly OPENROUTER_MODEL?: string;
	readonly GEMINI_API_KEY?: string;
	readonly GEMINI_MODEL?: string;
	readonly CLOUDFLARE_API_TOKEN?: string;
	readonly CLOUDFLARE_ACCOUNT_ID?: string;
	readonly CLOUDFLARE_AI_MODEL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
