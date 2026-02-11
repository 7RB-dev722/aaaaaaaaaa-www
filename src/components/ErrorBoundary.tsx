import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-800 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-gray-300 mb-6">واجه التطبيق مشكلة تمنع عرضه بشكل صحيح.</p>
            
            <div className="bg-slate-950 p-4 rounded-lg text-left overflow-auto max-h-48 mb-6 border border-slate-700" dir="ltr">
                <code className="text-red-400 text-xs font-mono whitespace-pre-wrap break-all">
                    {this.state.error?.message || this.state.error?.toString()}
                </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-colors font-bold"
            >
              <RefreshCw className="w-5 h-5" />
              <span>تحديث الصفحة</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
