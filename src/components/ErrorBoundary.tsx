import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { buildRawDump } from '../services/rawDump.ts';
import { downloadText } from '../services/download.ts';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Last line of defence: a render error must never leave a blank screen or hide the user's data. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div dir="rtl" role="alert" className="min-h-screen bg-[#080C14] text-[#F5F7FA] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#141E34] border border-rose-500/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" aria-hidden="true" />
            <h1 className="text-lg font-bold">משהו השתבש באפליקציה</h1>
          </div>
          <p className="text-sm text-[#AAB4C5] leading-relaxed">
            אירעה שגיאה לא צפויה. הנתונים שלך לא נמחקו ועדיין שמורים במכשיר. אפשר לנסות שוב, ולשמור עותק גולמי של כל הנתונים לפני שממשיכים.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="flex-1 py-3 px-4 bg-[#00E676] text-[#080C14] text-sm font-bold rounded-xl min-h-[48px]"
            >
              ניסיון חוזר
            </button>
            <button
              onClick={() =>
                downloadText(`kama-ze-ole-raw-data-${new Date().toISOString().slice(0, 10)}.json`, buildRawDump())
              }
              className="flex-1 py-3 px-4 bg-slate-800 text-[#F5F7FA] text-sm font-semibold rounded-xl min-h-[48px]"
            >
              הורדת עותק גולמי של הנתונים
            </button>
          </div>
        </div>
      </div>
    );
  }
}
