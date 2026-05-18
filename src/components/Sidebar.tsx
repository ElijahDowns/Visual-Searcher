import { useGraphStore } from '../store/graphStore';

export default function Sidebar() {
  const { isSidebarOpen, selectedNode, selectedSummary, setSidebarOpen,
          setSelectedNode, setSelectedSummary } = useGraphStore();

  const handleClose = () => {
    setSidebarOpen(false);
    setSelectedNode(null);
    setSelectedSummary(null);
  };

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      right: isSidebarOpen ? 0 : '-420px',
      width: '400px',
      height: '100vh',
      background: 'rgba(8, 8, 8, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderLeft: '1px solid rgba(255,255,255,0.1)',
      color: '#ffffff',
      fontFamily: "'Space Mono', monospace",
      padding: '28px 24px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1000,
    }}>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          padding: '5px 12px',
          marginBottom: '24px',
          display: 'block',
          marginLeft: 'auto',
          letterSpacing: '0.12em',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
        }}
      >
        CLOSE ✕
      </button>

      {selectedNode && (
        <>
          <div style={{
            fontSize: '10px',
            opacity: 0.35,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            {selectedNode.type} · depth {selectedNode.level}
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '24px',
            lineHeight: 1.3,
            letterSpacing: '0.02em',
          }}>
            {selectedNode.name}
          </h2>
        </>
      )}

      {!selectedSummary && selectedNode && (
        <div style={{ opacity: 0.4, fontSize: '12px', letterSpacing: '0.1em' }}>
          LOADING...
        </div>
      )}

      {selectedSummary && (
        <>
          {selectedSummary.thumbnail && (
            <img
              src={selectedSummary.thumbnail.source}
              alt={selectedSummary.title}
              style={{
                width: '100%',
                height: '160px',
                objectFit: 'cover',
                marginBottom: '20px',
                opacity: 0.8,
                filter: 'grayscale(30%)',
              }}
            />
          )}

          <p style={{
            fontSize: '13px',
            lineHeight: '1.8',
            marginBottom: '28px',
            opacity: 0.85,
            borderLeft: '1px solid rgba(255,255,255,0.15)',
            paddingLeft: '16px',
          }}>
            {selectedSummary.extract}
          </p>

          {selectedSummary.content_urls?.desktop?.page && (
            <a
              href={selectedSummary.content_urls.desktop.page}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px',
                textDecoration: 'none',
                color: '#fff',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              OPEN IN WIKIPEDIA →
            </a>
          )}
        </>
      )}
    </aside>
  );
}
