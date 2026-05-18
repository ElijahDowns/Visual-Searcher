import { useGraphStore } from '../store/graphStore';

export default function LoadingOverlay() {
  const isLoading = useGraphStore(s => s.isLoading);
  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: "'Space Mono', monospace",
      color: '#fff',
      gap: '24px',
    }}>
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        INITIALIZING KNOWLEDGE GRAPH
      </div>
      <div style={{
        width: '200px',
        height: '1px',
        background: 'rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#fff',
          animation: 'scan 1.5s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3 }
          50% { opacity: 1 }
        }
        @keyframes scan {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(200%) }
        }
      `}</style>
    </div>
  );
}
