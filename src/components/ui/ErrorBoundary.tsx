import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <motion.div
          className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-4"
          >
            💔
          </motion.div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            出了点小问题
          </h2>
          <p className="text-text-muted text-sm mb-6 max-w-xs">
            应用遇到了意外错误，刷新页面通常可以解决
          </p>
          {this.state.error && (
            <p className="text-xs text-text-muted/50 mb-6 px-4 py-2 bg-warm-cream rounded-xl max-w-sm break-all font-mono">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={18} />
            重试
          </button>
          <p className="text-xs text-text-muted/40 mt-8">
            如果问题持续，请清除数据后重新配置
          </p>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
