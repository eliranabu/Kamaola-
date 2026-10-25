# כמה זה עולה?

אפליקציית Web (עברית, RTL) למעקב הוצאות עישון וחיסכון. הנתונים נשמרים מקומית בדפדפן (`localStorage`).

## פיתוח
```
bun install        # או npm install
npm run dev        # שרת Express + Vite ב־http://localhost:3000
npm test           # כל חבילות הבדיקות (tsx)
npm run lint       # tsc --noEmit
```

## פריסה (production)
```
npm run build      # בונה את הלקוח ל־dist/ ואת השרת ל־dist-server/server.mjs
npm start          # NODE_ENV=production, מגיש את dist/ + /api/insights
```
- `start` מריץ את הבנייה בלבד (בלי Vite dev) ומגיש את `dist/` מתיקיית העבודה — הריצו מתיקיית הפרויקט.
- משתני סביבה (ראו `.env.example`): `GEMINI_API_KEY` (רק בצד שרת), `PORT`, `GEMINI_MODEL`, `TRUST_PROXY_HOPS`.
- בלי `GEMINI_API_KEY` ה־endpoint מחזיר 503 והאפליקציה מציגה הודעת „שירות לא זמין”.
- אירוח סטטי בלבד (בלי השרת) נתמך: כל האפליקציה עובדת, ורק „תובנות חכמות” לא זמינות.
