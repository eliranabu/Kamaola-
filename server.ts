import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Gemini API instance (Server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

// POST /api/insights - Analyze smoking habits & suggest positive financial milestones
app.post('/api/insights', async (req, res) => {
  try {
    const { totalMonthlySpent, totalPacks, dailyAverage, projectedAnnual, currency = '₪' } = req.body;

    // Fallback if no API key or empty data
    if (!aiClient || !totalMonthlySpent || totalMonthlySpent <= 0) {
      return res.json({
        summary: `ההוצאה החודשית הנוכחית שלכם עומדת על כ־${totalMonthlySpent || 0} ${currency}. צמצום של 25% בלבד יפנה כ־${Math.round((totalMonthlySpent || 0) * 0.25 * 12)} ${currency} בשנה שלמה!`,
        tips: [
          'המרת קנייה יומית של חפיסה לקנייה מרוכזת אחת לשבוע יכולה לחסוך נסיעות ודחפים רגעיים.',
          'מעקב שוטף באפליקציה מיד לאחר כל רכישה מגביר את המודעות להוצאות ב־30%.',
          'הקצו את הכסף שנחסך מדי חודש לחיסכון אוטומטי בהוראת קבע כדי לראות אותו גדל.'
        ],
        milestoneIdea: `בתוך שנה של הפחתה של 25%, תוכלו לממן סופ״ש זוגי או שדרוג מוצרי חשמל לבית.`
      });
    }

    const prompt = `
אתה יועץ פיננסי אישי באפליקציה הישראלית "כמה זה עולה?".
המשתמש מתעד הוצאות על סיגריות בישראל.
להלן נתוני המשתמש:
- הוצאה חודשית נוכחית: ${totalMonthlySpent} ${currency}
- חפיסות שנרכשו החודש: ${totalPacks}
- ממוצע הוצאה יומי: ${dailyAverage} ${currency}
- אומדן הוצאה שנתי: ${projectedAnnual} ${currency}

המשימה שלך:
כתוב ניתוח קצר, חיובי ומעודד (בשום אופן לא שיפוטי או מעליב) בעברית תקנית.
החזר תוצאה אך ורק במבנה JSON תקין ללא שום טקסט מסביב (strict JSON):
{
  "summary": "משפט או שניים שמסכמים את הפוטנציאל הכספי",
  "tips": [
    "טיפ מעשי 1 לחיסכון",
    "טיפ מעשי 2 לחיסכון",
    "טיפ מעשי 3 לתכנון כספי"
  ],
  "milestoneIdea": "דוגמה קונקרטית למטרה ישראלית נפוצה (חופשה, גאדג'ט, חיסכון בריבית) שהחיסכון השנתי יכול לממן"
}
`;

    const response = await aiClient.models.generateContent({
      model: 'models/gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating insights with Gemini:', error);
    // Graceful fallback response
    const { totalMonthlySpent = 0, currency = '₪' } = req.body || {};
    return res.json({
      summary: `ההוצאה החודשית שלכם עומדת על כ־${totalMonthlySpent} ${currency}. כל צמצום קטן יצטבר לסכום משמעותי בסוף השנה.`,
      tips: [
        'קביעת תקרת תקציב שבועית לסיגריות מפחיתה רכישות אימפולסיביות.',
        'תיעוד של כל רכישה שומר עליכם בשליטה מלאה.',
        'הפניית כספי החיסכון לקופת גמל להשקעה או פיקדון מייצרת רווח נוסף.'
      ],
      milestoneIdea: 'חיסכון של מאות שקלים בחודש מאפשר חופשה שנתית ללא עול פיננסי.'
    });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
