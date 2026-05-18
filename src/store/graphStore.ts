import { create } from 'zustand';
import type { GraphNode, GraphLink, WikiSummary } from '../types/graph';

interface GraphState {
  nodes: GraphNode[];
  links: GraphLink[];
  loadedIds: Set<string>;
  selectedNode: GraphNode | null;
  selectedSummary: WikiSummary | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  flyToId: string | null;

  addNodes: (newNodes: GraphNode[], newLinks: GraphLink[]) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setSelectedSummary: (summary: WikiSummary | null) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  markExpanded: (id: string) => void;
  setFlyToId: (id: string | null) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  links: [],
  loadedIds: new Set(),
  selectedNode: null,
  selectedSummary: null,
  isLoading: false,
  isSidebarOpen: false,
  flyToId: null,

  addNodes: (newNodes, newLinks) => {
    const { loadedIds, nodes, links } = get();
    const trulyNew = newNodes.filter(n => !loadedIds.has(n.id));
    const newSet = new Set(loadedIds);
    trulyNew.forEach(n => newSet.add(n.id));
    set({
      nodes: [...nodes, ...trulyNew],
      links: [...links, ...newLinks],
      loadedIds: newSet,
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),
  setSelectedSummary: (summary) => set({ selectedSummary: summary }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setFlyToId: (id) => set({ flyToId: id }),

  markExpanded: (id) => {
    set(state => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, expanded: true } : n),
    }));
  },
}));
