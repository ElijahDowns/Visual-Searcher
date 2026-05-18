import { useEffect } from 'react';
import { useGraphStore } from './store/graphStore';
import { fetchTopCategories } from './services/wikipedia';
import type { GraphNode } from './types/graph';
import { fibonacciSphere } from './utils/layout';
import Graph3D from './components/Graph3D';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import LoadingOverlay from './components/LoadingOverlay';

const FALLBACK_SEEDS = [
  'Category:Science', 'Category:History', 'Category:Arts',
  'Category:Technology', 'Category:Geography', 'Category:Mathematics',
  'Category:Philosophy', 'Category:Biology', 'Category:Physics',
  'Category:Computer science', 'Category:Medicine', 'Category:Literature',
];

export const SEED_COUNT = 12;
export const SEED_RADIUS = 380;

function buildSeedNodes(titles: string[]): GraphNode[] {
  const list = titles.slice(0, SEED_COUNT);
  const positions = fibonacciSphere(list.length, SEED_RADIUS);
  return list.map((title, i) => ({
    id: title,
    name: title.replace(/^Category:/, ''),
    type: 'category' as const,
    level: 0,
    val: 6,
    expanded: false,
    x: positions[i].x, y: positions[i].y, z: positions[i].z,
    fx: positions[i].x, fy: positions[i].y, fz: positions[i].z,
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
