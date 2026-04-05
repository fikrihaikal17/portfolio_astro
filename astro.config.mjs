// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://portfolio.kall.my.id",
  integrations: [tailwind(), react()],
  adapter: node({ mode: "standalone" }),
  vite: {
    resolve: {
      alias: {
        "@": "/src",
        "@components": "/src/components",
      },
    },
  },
  output: "server",
  build: {
    inlineStylesheets: "auto",
  },
  server: {
    host: true,
    port: 4321,
  },
});
