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
];

// Evenly space N points on a sphere shell (Fibonacci lattice)
export function fibonacciSphere(count: number, radius: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    return {
      x: r * Math.cos(theta) * radius,
      y: y * radius,
      z: r * Math.sin(theta) * radius,
    };
  });
}

// Pin a node at its position so physics never moves it
export function pinned(title: string, i: number, count: number, radius: number, level: number): GraphNode {
  const pos = fibonacciSphere(count, radius)[i];
  return {
    id: title,
    name: title.replace(/^Category:/, ''),
    type: 'category',
    level,
    val: 6,
    expanded: false,
    x: pos.x, y: pos.y, z: pos.z,
    fx: pos.x, fy: pos.y, fz: pos.z,
  };
}

function buildSeedNodes(titles: string[]): GraphNode[] {
  const list = titles.slice(0, 12); // keep it to 12 for clear spacing
  return list.map((title, i) => pinned(title, i, list.length, 380, 0));
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
