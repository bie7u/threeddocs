import { Component, type ReactNode } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

interface ErrorUIProps {
  error?: Error;
  onReload: () => void;
}

const ErrorUI = ({ error, onReload }: ErrorUIProps) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <div className="text-red-500 text-6xl">⚠️</div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          {t.errorBoundary.title}
        </h1>
        <p className="text-gray-300 mb-6 text-center">
          {t.errorBoundary.desc}
        </p>
        <div className="space-y-3">
          <button
            onClick={onReload}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {t.errorBoundary.reload}
          </button>
        </div>
        {error && (
          <details className="mt-6">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
              {t.errorBoundary.showDetails}
            </summary>
            <pre className="mt-2 text-xs text-red-400 bg-gray-900 p-3 rounded overflow-auto max-h-40">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

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
        <ErrorUI
          error={this.state.error}
          onReload={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}
