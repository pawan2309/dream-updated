import { useRouter } from 'next/router';

export default function Unauthorized() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px'
          }}>
            🚫
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            Access Denied
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            You don't have permission to access this page.
          </p>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <p style={{
            color: '#dc2626',
            fontSize: '14px',
            margin: 0
          }}>
            <strong>Reason:</strong> This operating panel is only accessible to users with OWNER role.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={handleGoBack}
            style={{
              width: '100%',
              padding: '12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            Go Back to Login
          </button>

          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '16px'
          }}>
            <p>If you believe this is an error, please contact your administrator.</p>
            <p>Operating Panel: admin.batxgames.site</p>
          </div>
        </div>
      </div>
    </div>
  );
} 