import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          background: '#f8fafc',
          color: '#0A2342',
          textAlign: 'center',
        }}>
          <div style={{
            background: '#ffffff',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(10, 35, 66, 0.08)',
            maxWidth: '520px',
            width: '100%',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px',
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', color: '#0A2342' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh or navigate back.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '11px 22px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0A2342 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(10, 35, 66, 0.2)',
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/admin/bookings';
                }}
                style={{
                  padding: '11px 22px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0A2342',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Go to Bookings
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
