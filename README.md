# Portfolio Astro
Personal portfolio website built with Astro, React, Tailwind CSS, and TypeScript.
This project is designed for a modern visual style with smooth motion, responsive layout, reusable section components, and now includes a Superadmin CMS + Monitoring panel backed by MySQL.

## Live and Source

- Live demo: https://portfolio.kall.my.id
- Repository: https://github.com/fikrihaikal17/portfolio_astro.git

## Highlights

- Server-rendered Astro output for dynamic admin features
- Animated hero and UI motion powered by GSAP and AOS
- Mixed Astro + React architecture for flexible component usage
- Tailwind-based styling with custom theme variables
- Modular section structure (Home, Projects, Contact, Footer)
- Superadmin dashboard for website settings, CMS entries, and monitoring events/sessions

## Tech Stack

- Astro
- React
- Tailwind CSS
- TypeScript
- GSAP
- AOS
- Firebase (for integration needs in this project)
- MySQL (for superadmin CMS and monitoring data)

## Credits and References

- Astro theme inspiration: https://astro.build/themes/details/dark-minimal/
- ReactBits showcase: https://www.reactbits.dev/showcase
- LetterGlitch component is adapted from ReactBits

## Quick Start

### Prerequisites

- Node.js 18+
- Package manager: npm or pnpm

### Clone and Install

```bash
git clone https://github.com/fikrihaikal17/portfolio_astro.git
cd portfolio_astro
npm install
```

If you use pnpm:

```bash
pnpm install
```

### Run Development Server

```bash
npm run dev
```

Default local URL: http://localhost:4321

## Available Scripts

```bash
npm run dev      # Start development server
npm run start    # Alias of dev
npm run build    # Run astro check, then production build
npm run preview  # Preview production build locally
npm run astro    # Run Astro CLI commands
```

## Project Structure

```text
public/
     fonts/
     svg/
src/
     components/
          contact.astro
          footer.astro
          home.astro
          logoWall.astro
          nav.astro
          projects.astro
     layouts/
          Layout.astro
     pages/
          index.astro
     React/
          LetterGlitch.tsx
          LikeButton.tsx
          SkillsList.tsx
```

## Configuration Notes

- Astro output mode: `server` (Node adapter)
- Dev server host: enabled (`host: true`)
- Dev server port: `4321`
- Vite alias `@` -> `/src`
- Vite alias `@components` -> `/src/components`

## Superadmin Panel (CMS + Monitoring)

The project includes a complete superadmin panel at:

- `/admin/login` (authentication)
- `/admin` (dashboard for setting, CMS, and monitoring)

### Features

- Secure superadmin login with MySQL-backed session tracking
- CMS page management (`cms_pages` table)
- Website settings management (`site_settings` table)
- Monitoring events and active admin sessions (`monitoring_events`, `admin_sessions`)

### Setup Steps

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill MySQL credentials in `.env`.

3. Create database and import schema:

```bash
mysql -u root -p portfolio_admin < database/superadmin_mysql.sql
```

4. Start app:

```bash
pnpm dev
```

5. Login superadmin:

- URL: `http://localhost:4321/admin/login` (or current dev port)
- Username: `superadmin`
- Password: `ChangeMe123!`

Important: change the default password immediately in production.

## Public Floating Chatbot (AI Fallback)

The public website now supports a floating AI chatbot widget with automatic provider fallback.

### Endpoint

- Public route: `/api/public-chat`
- Fallback order: `Groq -> OpenRouter -> Gemini -> Cloudflare Workers AI`
- Primary layer: Groq

### Environment Variables

Configure these in `.env`:

```bash
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
```

Notes:

- Never hardcode API keys in frontend code.
- If one provider is unavailable, the backend automatically tries the next provider.

## Customization Guide

### 1. Update Contact Email

Search for email links in:

- `src/components/home.astro`
- `src/components/footer.astro`
- `CODE_OF_CONDUCT.md`

Then replace with your own address.

### 2. Change Spotify Embed in Footer

1. Open Spotify and select an album.
2. Click Share.
3. Copy the embed URL/code.
4. Replace the existing iframe in `src/components/footer.astro`.

Example:

```html
<iframe src="https://open.spotify.com/embed/album/YOUR_ALBUM_ID_HERE" style="border-radius:12px;border:0;" class="w-full h-40" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
```

### 3. Update Live URL in Documentation

If you deploy to a new domain, update the link in this README and any metadata files that reference the old URL.

## Deployment

This project uses Astro server output, so deploy on environments that support Node server runtime.

Basic deployment flow:

1. Push your latest code to GitHub.
2. Set all required `.env` values in deployment platform.
3. Use build command: `npm run build`.
4. Run Node server output from Astro adapter (`@astrojs/node`).

## Troubleshooting

- Port already in use: run `npm run dev -- --port 4322`
- Dependencies out of sync: delete `node_modules`, reinstall dependencies, then build again
- Verify project health: run `npm run build` or `pnpm astro check`

## License

This project is licensed under the MIT License.
See `LICENSE` for complete terms and supplemental clarification.
