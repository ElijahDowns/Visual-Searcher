import { useState, useRef } from 'react';
import { searchWikipedia, fetchPageSummary, fetchArticleLinks } from '../services/wikipedia';
import { useGraphStore } from '../store/graphStore';
import { fibonacciSphere, childDiskPositions } from '../utils/layout';
import { SEED_RADIUS } from '../App';
import type { GraphNode } from '../types/graph';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ title: string; description: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const {
    addNodes, nodes, markExpanded,
    setSelectedNode, setSidebarOpen, setSelectedSummary, setFlyToId,
  } = useGraphStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); setIsOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await searchWikipedia(val);
      setResults(res);
      setIsOpen(res.length > 0);
    }, 300);
  };

  const handleSelect = async (title: string) => {
    // Close UI immediately so it feels responsive
    setQuery('');
    setResults([]);
    setIsOpen(false);

    // Place at next free slot on seed sphere
    const slot = nodes.filter(n => n.level === 0).length;
    const pos = fibonacciSphere(slot + 1, SEED_RADIUS)[slot];

    const newNode: GraphNode = {
      id: title, name: title, type: 'article', level: 0, val: 4, expanded: false,
      x: pos.x, y: pos.y, z: pos.z,
      fx: pos.x, fy: pos.y, fz: pos.z,
    };

    addNodes([newNode], []);
    setSelectedSummary(null);
    setSelectedNode(newNode);
    setSidebarOpen(true);

    // Fetch sidebar summary in parallel — don't block expansion
    fetchPageSummary(title)
      .then(s => setSelectedSummary(s))
      .catch(() => setSelectedSummary(null));

    // Auto-expand: fetch related articles and pin them around the search node
    try {
      const links = await fetchArticleLinks(title);
      if (links.length > 0) {
        const spread = 130;
        const diskPos = childDiskPositions(links.length, pos.x, pos.y, pos.z, spread);
        const children: GraphNode[] = links.map((l, i) => ({
          id: l.title, name: l.title, type: 'article' as const,
          level: 1, val: 1, expanded: false,
          x: diskPos[i].x, y: diskPos[i].y, z: diskPos[i].z,
          fx: diskPos[i].x, fy: diskPos[i].y, fz: diskPos[i].z,
        }));
        addNodes(children, children.map(n => ({ source: title, target: n.id })));
        markExpanded(title);
      }
    } catch {
      // Expansion failed — still fly to the single node
    }

    // Signal Graph3D to fly to the cluster (children are now in the store)
    setFlyToId(title);
  };

  return (
    <div style={{
      position: 'fixed', top: '24px', left: '50%',
      transform: 'translateX(-50%)', zIndex: 999, width: '440px', maxWidth: '90vw',
    }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); setTimeout(() => setIsOpen(false), 150); }}
        placeholder="SEARCH WIKIPEDIA..."
        style={{
          width: '100%',
          background: 'rgba(6,6,6,0.88)',
          border: `1px solid ${isFocused ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}`,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: '#fff', fontFamily: "'Space Mono', monospace",
          fontSize: '12px', padding: '13px 18px', boxSizing: 'border-box',
          outline: 'none', letterSpacing: '0.1em', transition: 'border-color 0.2s',
        }}
      />
      {isOpen && results.length > 0 && (
        <ul style={{
          listStyle: 'none', margin: 0, padding: 0,
          background: 'rgba(6,6,6,0.96)',
          border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none',
          maxHeight: '340px', overflowY: 'auto', backdropFilter: 'blur(12px)',
        }}>
          {results.map(r => (
            <li
              key={r.title}
              onMouseDown={() => handleSelect(r.title)}
              style={{
                padding: '11px 18px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontFamily: "'Space Mono', monospace", transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: '12px', color: '#fff', letterSpacing: '0.03em' }}>
                {r.title}
              </div>
              {r.description && (
                <div style={{
                  fontSize: '10px', opacity: 0.4, marginTop: '3px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '0.05em',
                }}>
                  {r.description}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
