import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal.tsx';
import { X, Check, Calendar, Clock, MapPin, FileText, ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { Purchase, UserSettings } from '../types/index.ts';
import { POPULAR_ISRAELI_BRANDS } from '../services/storage.ts';
import { calculatePurchaseTotal, validatePurchaseData, formatCurrency, MAX_PRICE_PER_PACK, MAX_QUANTITY } from '../services/calculations.ts';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Purchase, 'id' | 'totalPrice' | 'createdAt'> & { id?: string }
  ) => { success: boolean; error?: string } | void;
  initialPurchase?: Purchase | null;
  settings: UserSettings;
}

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPurchase,
  settings
}) => {
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const brandSelectRef = useRef<HTMLSelectElement>(null);
  const customBrandInputRef = useRef<HTMLInputElement>(null);

  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [brand, setBrand] = useState('');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');
  const [pricePerPack, setPricePerPack] = useState<string>('39');
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Initialize or reset when modal opens or initialPurchase changes
  useEffect(() => {
    if (initialPurchase) {
      setBrand(initialPurchase.brand);
      const isKnown = POPULAR_ISRAELI_BRANDS.includes(initialPurchase.brand);
      setIsCustomBrand(!isKnown);
      if (!isKnown) setCustomBrandName(initialPurchase.brand);
      setPricePerPack(String(initialPurchase.pricePerPack));
      setQuantity(initialPurchase.quantity);
      setDate(initialPurchase.date);
      setTime(initialPurchase.time || '');
      setLocation(initialPurchase.location || '');
      setNote(initialPurchase.note || '');
      if (initialPurchase.location || initialPurchase.note || initialPurchase.time) {
        setShowOptionalFields(true);
      }
    } else {
      const defaultBrand = POPULAR_ISRAELI_BRANDS[0];
      setBrand(defaultBrand);
      setIsCustomBrand(false);
      setCustomBrandName('');
      const rememberedPrice = settings.lastBrandPrices[defaultBrand] || 39;
      setPricePerPack(String(rememberedPrice));
      setQuantity(1);
      setDate(getTodayString());
      setTime('');
      setLocation('');
      setNote('');
      setShowOptionalFields(false);
    }
    setErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
    setConfirmDiscard(false);
  }, [initialPurchase, isOpen, settings]);

  useEffect(() => {
    if (confirmDiscard) keepEditingRef.current?.focus();
  }, [confirmDiscard]);

  // Never lose typed input silently: closing a modified form asks first
  const requestClose = () => {
    if (isDirty && !isSubmitting) setConfirmDiscard(true);
    else onClose();
  };

  const changeQuantity = (q: number) => {
    setQuantity(q);
    setIsDirty(true);
  };

  if (!isOpen) return null;

  const handleBrandChange = (selected: string) => {
    if (selected === '__CUSTOM__') {
      setIsCustomBrand(true);
      setBrand('');
    } else {
      setIsCustomBrand(false);
      setBrand(selected);
      // Auto-populate last remembered price for brand
      if (settings.lastBrandPrices[selected]) {
        setPricePerPack(String(settings.lastBrandPrices[selected]));
      }
    }
    if (errors.brand) {
      setErrors((prev) => ({ ...prev, brand: '' }));
    }
  };

  const activeBrandName = isCustomBrand ? customBrandName.trim() : brand;
  const numPrice = parseFloat(pricePerPack) || 0;
  const currentTotal = calculatePurchaseTotal(numPrice, quantity);
  const todayStr = getTodayString();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validation = validatePurchaseData({
      brand: activeBrandName,
      pricePerPack: numPrice,
      quantity,
      date
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = onSave({
        id: initialPurchase?.id,
        brand: activeBrandName,
        pricePerPack: numPrice,
        quantity,
        date,
        time: time.trim() || undefined,
        location: location.trim() || undefined,
        note: note.trim() || undefined
      });

      if (result && !result.success) {
        setErrors({ form: result.error || 'אירעה שגיאה בעת שמירת הרכישה. הנתונים שנרשמו נשמרו בטופס לבדיקה.' });
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving purchase:', err);
      setErrors({ form: err.message || 'אירעה שגיאה בלתי צפויה. נא לבדוק את הנתונים ולנסות שוב.' });
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      closeOnBackdrop={false}
      labelledBy="add-purchase-title"
      describedBy="add-purchase-desc"
      initialFocusRef={isCustomBrand ? customBrandInputRef : brandSelectRef}
      overlayClassName="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80"
      panelClassName="w-full max-w-lg bg-[#141E34] border border-slate-700/80 rounded-t-3xl sm:rounded-2xl max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden"
    >
        {/* Mobile Drag Handle Affordance */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0" aria-hidden="true">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#080C14]/60">
          <div>
            <h2 id="add-purchase-title" className="text-lg font-bold text-[#F5F7FA]">
              {initialPurchase ? 'עריכת רכישה' : 'הוספת רכישה חדשה'}
            </h2>
            <p id="add-purchase-desc" className="text-xs text-[#AAB4C5] mt-0.5">
              {initialPurchase ? 'עדכון פרטי הרכישה שנשמרו' : 'תיעוד מהיר של רכישת חפיסות סיגריות'}
            </p>
          </div>
          <button
            onClick={requestClose}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-[#AAB4C5] hover:text-[#F5F7FA] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
            aria-label="סגירת חלון"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} onInput={() => setIsDirty(true)} noValidate className="p-5 overflow-y-auto space-y-4 pb-8 sm:pb-5">
          {confirmDiscard && (
            <div role="alert" className="p-3 bg-amber-500/15 border border-amber-500/40 text-amber-100 text-xs sm:text-sm rounded-xl space-y-2.5">
              <p className="font-semibold">יש שינויים שלא נשמרו. לסגור בלי לשמור?</p>
              <div className="flex gap-2">
                <button type="button" ref={keepEditingRef} onClick={() => setConfirmDiscard(false)} className="flex-1 py-2.5 bg-[#00E676] text-[#080C14] font-bold rounded-lg min-h-[44px]">המשך עריכה</button>
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-[#F5F7FA] font-semibold rounded-lg min-h-[44px]">סגור בלי לשמור</button>
              </div>
            </div>
          )}
          {errors.form && (
            <div
              role="alert"
              className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs rounded-xl flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* 1. Brand Selection */}
          <div>
            <label htmlFor="brand-select" className="block text-xs font-semibold text-[#AAB4C5] mb-1.5">
              מותג סיגריות <span className="text-[#00E676]" aria-hidden="true">*</span>
            </label>
            {!isCustomBrand ? (
              <div className="relative">
                <select
                  id="brand-select"
                  ref={brandSelectRef}
                  value={brand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  aria-invalid={!!errors.brand}
                  aria-describedby={errors.brand ? 'brand-error' : undefined}
                  className={`w-full bg-[#080C14] border ${
                    errors.brand ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700 focus:border-[#00E676]'
                  } text-[#F5F7FA] text-sm rounded-xl px-3.5 py-3 appearance-none  transition-colors min-h-[44px]`}
                >
                  {POPULAR_ISRAELI_BRANDS.map((b) => (
                    <option key={b} value={b} className="bg-[#141E34] text-[#F5F7FA]">
                      {b}
                    </option>
                  ))}
                  <option value="__CUSTOM__" className="bg-[#141E34] text-[#00E676]">
                    + מותג אחר (הזנה ידנית)...
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#AAB4C5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id="brand-custom-input"
                  ref={customBrandInputRef}
                  type="text"
                  placeholder="הזנת שם מותג (לדוגמה: מרלבורו טאץ', לאקי סטרייק...)"
                  value={customBrandName}
                  onChange={(e) => {
                    setCustomBrandName(e.target.value);
                    if (errors.brand) setErrors((prev) => ({ ...prev, brand: '' }));
                  }}
                  aria-invalid={!!errors.brand}
                  aria-describedby={errors.brand ? 'brand-error' : undefined}
                  className={`flex-1 bg-[#080C14] border ${
                    errors.brand ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700 focus:border-[#00E676]'
                  } text-[#F5F7FA] text-sm rounded-xl px-3.5 py-2.5  transition-colors min-h-[44px]`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomBrand(false);
                    setBrand(POPULAR_ISRAELI_BRANDS[0]);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] text-xs font-medium rounded-xl transition-colors whitespace-nowrap min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
                >
                  בחר מרשימה
                </button>
              </div>
            )}
            {errors.brand && (
              <p id="brand-error" role="alert" className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {errors.brand}
              </p>
            )}
          </div>

          {/* 2. Price and Quantity side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Per Pack */}
            <div>
              <label htmlFor="price-per-pack" className="block text-xs font-semibold text-[#AAB4C5] mb-1.5">
                מחיר לחפיסה ({settings.currency}) <span className="text-[#00E676]" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="price-per-pack"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="1"
                  max={MAX_PRICE_PER_PACK}
                  value={pricePerPack}
                  onChange={(e) => {
                    setPricePerPack(e.target.value);
                    if (errors.pricePerPack) setErrors((prev) => ({ ...prev, pricePerPack: '' }));
                  }}
                  aria-invalid={!!errors.pricePerPack}
                  aria-describedby={errors.pricePerPack ? 'price-error' : undefined}
                  className={`w-full bg-[#080C14] border ${
                    errors.pricePerPack ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700 focus:border-[#00E676]'
                  } text-[#F5F7FA] text-base font-semibold rounded-xl px-3.5 py-2.5  transition-colors tabular-nums min-h-[44px]`}
                  placeholder="39"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#AAB4C5] pointer-events-none">
                  {settings.currency}
                </span>
              </div>
              {errors.pricePerPack && (
                <p id="price-error" role="alert" className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {errors.pricePerPack}
                </p>
              )}
            </div>

            {/* Quantity with quick buttons */}
            <div>
              <label htmlFor="quantity-input" className="block text-xs font-semibold text-[#AAB4C5] mb-1.5">
                כמות חפיסות <span className="text-[#00E676]" aria-hidden="true">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeQuantity(Math.max(1, quantity - 1))}
                  aria-label="הפחתת חפיסה אחת"
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] text-lg font-bold rounded-xl flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
                >
                  -
                </button>
                <input
                  id="quantity-input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={MAX_QUANTITY}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setQuantity(isNaN(val) ? 1 : Math.min(MAX_QUANTITY, Math.max(1, val)));
                    if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                  }}
                  aria-invalid={!!errors.quantity}
                  aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                  className={`flex-1 text-center bg-[#080C14] border ${
                    errors.quantity ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700 focus:border-[#00E676]'
                  } text-[#F5F7FA] text-base font-bold rounded-xl py-2.5  tabular-nums min-h-[44px]`}
                />
                <button
                  type="button"
                  onClick={() => changeQuantity(Math.min(MAX_QUANTITY, quantity + 1))}
                  aria-label="הוספת חפיסה אחת"
                  className="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] text-lg font-bold rounded-xl flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676]"
                >
                  +
                </button>
              </div>

              {/* Quick quantity presets with 44px min touch height */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 5, 10].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      changeQuantity(q);
                      if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                    }}
                    aria-label={`בחירת ${q === 10 ? 'פקט (10 חפיסות)' : `${q} חפיסות`}`}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-colors min-h-[44px] flex items-center justify-center font-medium ${
                      quantity === q
                        ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676] font-bold shadow-sm'
                        : 'bg-slate-800/40 border-slate-700 text-[#AAB4C5] hover:text-[#F5F7FA]'
                    }`}
                  >
                    {q === 10 ? 'פקט (10)' : q}
                  </button>
                ))}
              </div>
              {errors.quantity && (
                <p id="quantity-error" role="alert" className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {errors.quantity}
                </p>
              )}
            </div>
          </div>

          {/* 3. Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="purchase-date" className="block text-xs font-semibold text-[#AAB4C5] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>תאריך הרכישה</span>
                <span className="text-[#00E676]" aria-hidden="true">*</span>
              </label>
              <input
                id="purchase-date"
                type="date"
                max={todayStr}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'date-error' : undefined}
                className={`w-full bg-[#080C14] border ${
                  errors.date ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700 focus:border-[#00E676]'
                } text-[#F5F7FA] text-sm rounded-xl px-3.5 py-2.5  transition-colors min-h-[44px]`}
              />
              {errors.date && (
                <p id="date-error" role="alert" className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {errors.date}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="purchase-time" className="block text-xs font-semibold text-[#AAB4C5] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  שעה (אופציונלי)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTime(getCurrentTimeString());
                    setIsDirty(true);
                  }}
                  className="text-xs text-[#00E676] hover:underline font-medium min-h-[30px] flex items-center"
                >
                  הגדר עכשיו
                </button>
              </label>
              <input
                id="purchase-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#080C14] border border-slate-700 focus:border-[#00E676] text-[#F5F7FA] text-sm rounded-xl px-3.5 py-2.5  transition-colors min-h-[44px]"
              />
            </div>
          </div>

          {/* 4. Expandable Optional Details (Location, Notes) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              aria-expanded={showOptionalFields}
              className="text-xs font-medium text-[#AAB4C5] hover:text-[#F5F7FA] flex items-center gap-1.5 py-2 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#00E676] rounded-lg"
            >
              <span>{showOptionalFields ? 'הסתרת פרטים נוספים (מקום והערה)' : '+ הוספת מקום רכישה או הערה אישית'}</span>
            </button>

            {showOptionalFields && (
              <div className="space-y-3 mt-2 pt-3 border-t border-slate-800">
                <div>
                  <label htmlFor="purchase-location" className="block text-xs font-semibold text-[#AAB4C5] mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    מקום הרכישה (אופציונלי)
                  </label>
                  <input
                    id="purchase-location"
                    type="text"
                    placeholder="לדוגמה: קיוסק ליד העבודה, תחנת דלק..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#080C14] border border-slate-700 focus:border-[#00E676] text-[#F5F7FA] text-sm rounded-xl px-3.5 py-2.5  transition-colors min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="purchase-note" className="block text-xs font-semibold text-[#AAB4C5] mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    הערה אישית (אופציונלי)
                  </label>
                  <input
                    id="purchase-note"
                    type="text"
                    placeholder="לדוגמה: נקנה ביציאה עם חברים"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-[#080C14] border border-slate-700 focus:border-[#00E676] text-[#F5F7FA] text-sm rounded-xl px-3.5 py-2.5  transition-colors min-h-[44px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Live Total Summary Box */}
          <div className="p-4 bg-[#080C14] border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[#AAB4C5]">סכום כולל לתשלום</span>
              <span className="text-xs text-[#AAB4C5] mt-0.5">
                {quantity} חפיסות × {numPrice || 0} {settings.currency}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#00E676] font-mono tabular-nums">
                {formatCurrency(currentTotal, settings.currency)}
              </span>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-[#F5F7FA] text-xs sm:text-sm font-semibold rounded-xl transition-colors min-h-[48px] focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 py-3 px-5 bg-[#00E676] hover:bg-[#00c864] text-[#080C14] text-xs sm:text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,230,118,0.25)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#00E676]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>שומר רכישה...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  <span>{initialPurchase ? 'עדכון רכישה' : 'שמירת רכישה'}</span>
                </>
              )}
            </button>
          </div>
        </form>
    </Modal>
  );
};
