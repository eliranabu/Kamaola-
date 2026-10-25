# tasks.md — כמה זה עולה?

מקור: דוח הביקורת (F-xx). סימון [X] רק לאחר בדיקה שרצה בפועל.

## שלב 0 — אימות זמן ריצה
- [X] tsc, `npm test` (tsx), `vite build`
- [X] Playwright ב־320/360/390/430/768 — נמצאה גלישה אופקית ב־768 (אזור כפתורי הסרגל העליון)

## P0
- [X] F-02 נתונים פגומים נשמרים כעותק שחזור לפני דריסה; סינון פר־פריט (`storage/normalize.ts`, `storage/backups.ts`) — tests/storage.recovery.test.ts + E2E
- [X] F-03 ErrorBoundary, נרמול בקריאה, ולידציית תשובת `/api/insights` — tests/insights.test.ts + E2E
- [X] F-01 ייבוא: תצוגה מקדימה, מיזוג/החלפה, גיבוי אוטומטי, ביטול ייבוא, חסום במצב הדגמה — tests/import.test.ts + E2E
- [X] F-05 תחזיות לפי תחילת מעקב; תחזית שנתית `null` עד 5 ימי מעקב; F-21 (DST) נפתר — tests/projections.test.ts
- [X] F-04 הסכמה מפורשת לפני שליחה ל־Gemini, הצגת ה־payload, עדכון טקסט הפרטיות — tests/insights.test.ts + E2E
- [X] פיצול `calculations.ts` ל־`calculations/*` ו־`storage.ts` ל־`storage/*`

## P1
- [X] F-06 מקור יחיד לבסיס החיסכון (`calculations/baseline.ts`) לסקירה ולמסך החיסכון (+F-20: חיסכון שנתי מחושב מהערך המדויק) — tests/consistency.test.ts
- [X] F-07 הקשחת `/api/insights` (`server/*`): ולידציה קפדנית, rate-limit, timeout, 400/413/429/502/503 כנים, סכימת פלט, בלי טקסט "AI" מומצא — tests/server.test.ts
- [X] F-08 `useNow`: התאריך מתעדכן בחצות ובחזרה ללשונית — tests/lifecycle.test.ts + E2E (Playwright clock)
- [X] F-09 תאריך עתידי נדחה בטופס/שמירה/ייבוא, ורכישות עתידיות שכבר שמורות לא נספרות בסטטיסטיקות — tests/consistency.test.ts + E2E
- [X] F-10 גבולות אחידים (קבועים משותפים) גם בשדות הטופס
- [X] F-11 מחיר אחרון למותג מתרענן מיד אחרי שמירה — E2E
- [X] F-12 איפוס/החלפת מצב הדגמה: טיפול בכשל, ללא הצלחה כוזבת; settings חוזרים לברירת מחדל; איפוס מוחק גם עותקי גיבוי — tests/lifecycle.test.ts + E2E
- [X] F-14 `build` בונה גם את השרת (`dist-server`), `start` עם NODE_ENV=production, `clean` חוצה־פלטפורמות, README + `.env.example` — נבדק בהרצה בפועל

## P2
- [X] F-13 `strict` TS, ESLint (typescript-eslint דרך TS6 API לצד `tsc` של TS7, react-hooks, jsx-a11y), Playwright E2E בריפו (34 תרחישים מול build ה־production), CI (`.github/workflows/ci.yml`), בדיקות unit ללא תלות בתאריך
- [X] F-15 `bun audit`: 0 פגיעויות; הוסרו `motion` ו־`autoprefixer`; bun כמנהל חבילות יחיד
- [X] F-19 ₪ בלבד: הוסרה בחירת המטבע, סמל אחד משותף (`CURRENCY_SYMBOL`), הגדרות ישנות עם $/€ מנורמלות
- [X] F-16 `Modal` משותף (focus-trap, inert, החזרת פוקוס, נעילת גלילה), הגנה מאובדן קלט בטופס, Toast עם live-region קבוע ושגיאות שנשארות, היררכיית כותרות, טקסט ≥12px, שמות נגישים לעמודות הגרף; axe: 0 Serious/Critical (desktop + phone, מסכים ודיאלוגים)
- [X] F-17 סרגל תחתון עם כפתור הוספה מרכזי (במקום FAB), כפתור תובנות במובייל, ללא גלישה אופקית ב־320–1280
- [X] F-18 אייקוני PWA: maskable אמיתי + תיקון אייקונים שהציגו ריבוע "tofu" במקום ₪ (גליף וקטורי ב־`icon.svg`); ללא נעילת פורטרט; SW רק ב־production; פונט Heebo מקומי; CSP וכותרות אבטחה; בדיקת offline

## P3
- [ ] F-20, F-22–F-24 · כיוון עיצובי (דורש אישור נפרד)

## הערות
- `App.tsx` (~340 שורות), `SettingsView.tsx` (~300), `AddPurchaseModal.tsx` (~600) עדיין מעל יעד 200 השורות; פיצול ל־hooks/רכיבים לא בוצע ב־P2.
- `storage.ts` 280 שורות (מעל היעד 200): נשאר מחלקה אחת; פיצול נוסף אפשרי ב־P1.
- בדיקות 38–40 הישנות קודדו את הבאג (ממוצע מיום 1 גם כשהרכישה הראשונה באמצע החודש); נתוני הבדיקה עודכנו כך שהרכישה הראשונה ב־1 לחודש, והתנהגות „התחלה באמצע חודש” נבדקת ב־tests/projections.test.ts.
- HSTS לא מוגדר בשרת (תלוי באירוח/HTTPS בקצה); CSP פעיל רק ב־production.
- ה־CI לא הורץ בפועל (אין GitHub Actions מהסביבה): נבדק תחבירית (YAML) והפקודות הורצו מקומית.
