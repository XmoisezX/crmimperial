import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-100 border border-red-400 text-red-700 min-h-screen flex flex-col items-center justify-center">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Ocorreu um erro inesperado.</h1>
          <p className="text-lg mb-4">O aplicativo falhou ao carregar esta seção.</p>
          <details className="mt-4 p-4 bg-white rounded-md shadow-inner w-full max-w-lg text-sm text-gray-800">
            <summary className="font-semibold cursor-pointer">Detalhes do Erro (Clique para expandir)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {this.state.error?.message || 'Mensagem de erro indisponível.'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tentar Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;