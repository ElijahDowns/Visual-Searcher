import { useEffect } from 'react';
import { useGraphStore } from './store/graphStore';
import { fetchTopCategories } from './services/wikipedia';
import type { GraphNode } from './types/graph';
import Graph3D from './components/Graph3D';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import LoadingOverlay from './components/LoadingOverlay';

const FALLBACK_SEEDS = [
  'Category:Science', 'Category:History', 'Category:Arts',
  'Category:Technology', 'Category:Geography', 'Category:Mathematics',
  'Category:Philosophy', 'Category:Biology', 'Category:Physics',
  'Category:Computer science', 'Category:Medicine', 'Category:Literature',
  'Category:Music', 'Category:Economics', 'Category:Politics',
  'Category:Culture', 'Category:Religion', 'Category:Sport',
  'Category:Society', 'Category:Law',
];

function buildSeedNodes(titles: string[]): GraphNode[] {
  return titles.slice(0, 20).map(title => ({
    id: title,
    name: title.replace(/^Category:/, ''),
    type: 'category' as const,
    level: 0,
    val: 6,
    expanded: false,
  }));
}

export default function App() {
  const { addNodes, setLoading, nodes } = useGraphStore();

  useEffect(() => {
    if (nodes.length > 0) return;
    setLoading(true);
    fetchTopCategories()
      .then(titles => addNodes(buildSeedNodes(titles.length > 0 ? titles : FALLBACK_SEEDS), []))
      .catch(() => addNodes(buildSeedNodes(FALLBACK_SEEDS), []))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <LoadingOverlay />
      <Graph3D />
      <SearchBar />
      <Sidebar />
    </>
  );
}
