import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="color:red;padding:20px;background:black;height:100vh;"><h1>Global Error</h1><pre>${e.error?.stack || e.message}</pre></div>`;
});

import {createRoot} from 'react-dom/client';
import Maintenance from './components/Maintenance.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'black', height: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Maintenance />
    </ErrorBoundary>
  </StrictMode>,
);

