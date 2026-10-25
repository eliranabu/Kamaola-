import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createApp, GenerateFn } from './server/app.ts';

dotenv.config();

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const MODEL = process.env.GEMINI_MODEL || 'models/gemini-3.8-flash';

// Gemini client lives on the server only; without a key the API answers 503 honestly.
let generate: GenerateFn | undefined;
if (process.env.GEMINI_API_KEY) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  generate = async (prompt) => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return response.text;
  };
}

const app = createApp({
  generate,
  csp: isProd,
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS || 0)
});

// Mount Vite (dev) or serve the built client (production, from the working directory)
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
