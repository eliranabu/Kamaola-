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
- [ ] F-06 מקור יחיד לכרטיס „25%” (סקירה) ולמסך החיסכון
- [ ] F-07 הקשחת `/api/insights` (ולידציה, rate-limit, timeout)
- [ ] F-08 זמן חי (`now` לא קפוא)
- [ ] F-09 תאריך עתידי (תאריך בלתי אפשרי כבר נדחה)
- [ ] F-10 שאריות: reader.onerror ✔, מגבלות אחידות ✔; נותר: קבועי UI (`max` בשדה כמות)
- [ ] F-11/F-12 סנכרון settings ב־state, טיפול ב־StorageResult באיפוס
- [ ] F-14 סקריפט start/NODE_ENV

## P2
- [ ] F-13 strict + ESLint + Vitest + Playwright בריפו + CI
- [ ] F-15 תלויות (body-parser), הסרת `motion`/`autoprefixer`
- [ ] F-16 Modal/Toast נגישים (ImportSection משתמש כרגע בדיאלוג ייעודי)
- [ ] F-17 גלישה ב־768, FAB, תובנות במובייל · F-18 PWA · F-19 מטבע

## P3
- [ ] F-20, F-22–F-24 · כיוון עיצובי (דורש אישור נפרד)

## הערות
- `storage.ts` 273 שורות (מעל היעד 200): נשאר מחלקה אחת; פיצול נוסף אפשרי ב־P1.
- בדיקות 38–40 הישנות קודדו את הבאג (ממוצע מיום 1 גם כשהרכישה הראשונה באמצע החודש); נתוני הבדיקה עודכנו כך שהרכישה הראשונה ב־1 לחודש, והתנהגות „התחלה באמצע חודש” נבדקת ב־tests/projections.test.ts.
