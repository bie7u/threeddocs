import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="text-red-500 text-6xl">⚠️</div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4 text-center">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-6 text-center">
              The application encountered an error. This might be due to corrupted data or an invalid model.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Clear localStorage and reload
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Clear Data & Reload
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium"
              >
                Try Again
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-red-400 bg-gray-900 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
