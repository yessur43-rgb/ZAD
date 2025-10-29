// Fix: Import `Component` from React to be used in class extension.
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// FIX: Changed from 'extends Component' to 'extends React.Component' and updated the import
// to resolve type errors where 'setState' and 'props' were not found on the component instance.
// Fix: Extend `Component` directly to resolve typing issues.
class ErrorBoundary extends Component<Props, State> {
  // FIX: Explicitly initialize all state properties for clarity and to prevent potential issues.
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }
  
  // A method to reset the error boundary state
  resetBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 text-center text-gray-800 dark:text-gray-200 m-4 border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">حدث خطأ ما</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            نعتذر، لقد واجهت هذه الأداة مشكلة غير متوقعة.
          </p>
          <button
            onClick={this.resetBoundary}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
          >
            حاول مرة أخرى
          </button>
          {this.state.error && (
             <details className="mt-4 text-xs text-left cursor-pointer">
                <summary className="text-gray-500">تفاصيل الخطأ</summary>
                <pre className="mt-2 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                </pre>
             </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
