import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="color:red;padding:20px;background:black;height:100vh;"><h1>Global Error</h1><pre>${e.error?.stack || e.message}</pre></div>`;
});

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
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
      const isTranslationError = this.state.error?.message?.includes('removeChild') || this.state.error?.message?.includes('insertBefore');
      
      return (
        <div style={{ padding: '20px', color: 'white', background: '#111827', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ marginBottom: '10px' }}>Упс! Что-то пошло не так.</h1>
          {isTranslationError && (
            <p style={{ marginBottom: '20px', textAlign: 'center', maxWidth: '500px', color: '#9ca3af', lineHeight: '1.5' }}>
              Похоже, в вашем браузере сработал автопереводчик или расширение, которое нарушило структуру страницы. Мы заблокировали эту проблему для будущих сеансов.
            </p>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 24px', background: '#06b6d4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}
          >
            Обновить страницу
          </button>
          <details style={{ marginTop: '40px', color: '#6b7280', fontSize: '12px', maxWidth: '80vw', overflow: 'auto' }}>
            <summary style={{ cursor: 'pointer' }}>Технические детали</summary>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{this.state.error?.toString()}</pre>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


