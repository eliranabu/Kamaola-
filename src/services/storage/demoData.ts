/** Static data: brand presets and the isolated demo sandbox dataset. */

import { Purchase } from '../../types/index.ts';

// Popular Israeli cigarette brands for instant auto-complete & price presets
export const POPULAR_ISRAELI_BRANDS = [
  'מרלבורו אדום (Marlboro Red)',
  'מרלבורו גולד (Marlboro Gold)',
  'פרלמנט נייט בלו (Parliament Night Blue)',
  'פרלמנט סילבר (Parliament Silver Blue)',
  'וינסטון כחול (Winston Blue)',
  'וינסטון אדום (Winston Red)',
  'קאמל צהוב (Camel Yellow)',
  'קאמל כחול (Camel Blue)',
  'קנט (Kent)',
  'אל אם אדום (L&M Red)',
  'אל אם כחול (L&M Blue)',
  'טיים (Time)',
  'נובלס (Noblesse)',
  'נקסט (Next)',
  'פאל מאל (Pall Mall)',
  'דבידוף (Davidoff)',
  'טבק לגלגול (Rolling Tobacco)'
];

/**
 * Realistic Israeli demo dataset for safe walkthroughs.
 * STRICTLY ISOLATED: Never mixed into user's real purchases!
 */
export const SAMPLE_DEMO_PURCHASES: Purchase[] = [
  {
    id: 'demo-1',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 1,
    totalPrice: 39,
    date: '2026-10-18',
    time: '14:30',
    location: 'קיוסק המרכז, תל אביב',
    note: 'הפסקה מהעבודה',
    createdAt: 1729254600000,
    isDemo: true
  },
  {
    id: 'demo-2',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 2,
    totalPrice: 78,
    date: '2026-10-15',
    time: '19:15',
    location: 'תחנת דלק פז',
    note: 'לקראת סוף שבוע',
    createdAt: 1729012500000,
    isDemo: true
  },
  {
    id: 'demo-3',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 1,
    totalPrice: 39,
    date: '2026-10-12',
    time: '09:00',
    location: 'פיצוצייה שכונתית',
    createdAt: 1728716400000,
    isDemo: true
  },
  {
    id: 'demo-4',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 2,
    totalPrice: 78,
    date: '2026-10-08',
    time: '17:45',
    location: 'סופר פארם',
    createdAt: 1728373500000,
    isDemo: true
  },
  {
    id: 'demo-5',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 1,
    totalPrice: 39,
    date: '2026-10-04',
    time: '11:20',
    createdAt: 1728026400000,
    isDemo: true
  },
  {
    id: 'demo-6',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 2,
    totalPrice: 78,
    date: '2026-10-01',
    time: '08:30',
    location: 'ילו מנטה',
    createdAt: 1727767800000,
    isDemo: true
  },
  // Previous month (September 2026) for comparison
  {
    id: 'demo-prev-1',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 10,
    totalPrice: 390,
    date: '2026-09-20',
    time: '16:00',
    note: 'קנייה מרוכזת (פקט)',
    createdAt: 1726838400000,
    isDemo: true
  },
  {
    id: 'demo-prev-2',
    brand: 'מרלבורו גולד (Marlboro Gold)',
    pricePerPack: 39,
    quantity: 10,
    totalPrice: 390,
    date: '2026-09-05',
    time: '12:00',
    note: 'קנייה מרוכזת (פקט)',
    createdAt: 1725537600000,
    isDemo: true
  }
];
