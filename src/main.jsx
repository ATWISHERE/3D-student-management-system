import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Caught by ErrorBoundary:', error, errorInfo);
  }

  handleEnableSafeMode = () => {
    try {
      localStorage.setItem('atw_safe_mode', 'true');
    } catch {}
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('atw_safe_mode');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errStr = this.state.error ? this.state.error.toString() : '';
      const isWebGL = errStr.toLowerCase().includes('webgl') || errStr.toLowerCase().includes('three');

      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle at center, #1e1b18 0%, #0c0a09 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Montserrat, -apple-system, sans-serif',
          zIndex: 999999,
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: 'rgba(28, 25, 23, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(217, 119, 6, 0.2)',
            backdropFilter: 'blur(16px)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3.2rem', marginBottom: '1rem' }}>
              {isWebGL ? '🛡️' : '⚠️'}
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 70%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.75rem'
            }}>
              {isWebGL ? 'WebGL Hardware Acceleration Issue' : 'Application Recovered'}
            </h1>
            <p style={{ color: '#a8a29e', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {isWebGL
                ? 'Your device or browser currently cannot initialize 3D hardware acceleration. Click below to launch in Safe 2D Mode (Festive Firecrackers, Attendance, Directory & Excel export remain 100% active).'
                : 'An unexpected display error occurred. You can reload or start in safe mode.'}
            </p>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                onClick={this.handleEnableSafeMode}
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #d97706 100%)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '30px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(217, 119, 6, 0.35)'
                }}
              >
                ⚡ Launch in Safe 2D Mode
              </button>
              <button
                onClick={this.handleResetAndReload}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '0.7rem 1.2rem',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  cursor: 'pointer'
                }}
              >
                🔄 Reload App
              </button>
            </div>

            <details style={{ textAlign: 'left', marginTop: '1rem', color: '#78716c', fontSize: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', outline: 'none', color: '#a8a29e' }}>Diagnostic details</summary>
              <pre style={{
                marginTop: '0.5rem',
                padding: '0.8rem',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '8px',
                overflowX: 'auto',
                color: '#f87171',
                fontSize: '0.72rem',
                whiteSpace: 'pre-wrap'
              }}>
                {errStr}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
