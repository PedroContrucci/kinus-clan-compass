import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  tabName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  key: number;
}

export class TabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, key: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[TabErrorBoundary:${this.props.tabName}]`, error, info);
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, key: s.key + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="text-4xl mb-3">😕</div>
          <h3 className="font-['Outfit'] text-base font-semibold text-foreground mb-1">
            Algo deu errado ao exibir esta seção
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm">
            Tivemos um imprevisto ao carregar <span className="text-foreground">{this.props.tabName}</span>. As outras abas continuam funcionando.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-colors font-['Outfit']"
          >
            <RefreshCw size={14} /> Recarregar
          </button>
        </div>
      );
    }
    return <div key={this.state.key}>{this.props.children}</div>;
  }
}

export default TabErrorBoundary;
