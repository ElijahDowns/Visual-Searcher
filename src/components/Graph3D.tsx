import ForceGraph3D from 'react-force-graph-3d';
import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { useGraphStore } from '../store/graphStore';
import { fetchCategoryMembers, fetchPageSummary } from '../services/wikipedia';
import type { GraphNode, GraphLink } from '../types/graph';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FGRef = any;

interface NodeObject extends GraphNode {
  x: number;
  y: number;
  z: number;
}

export default function Graph3D() {
  const graphRef = useRef<FGRef>(null);
  const {
    nodes, links,
    addNodes, setSelectedNode, setSelectedSummary,
    setSidebarOpen, markExpanded,
  } = useGraphStore();

  // Key on length to avoid restarting physics simulation on every state change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const graphData = useMemo(() => ({ nodes, links }), [nodes.length, links.length]);

  const handleNodeClick = useCallback(async (rawNode: object) => {
    const node = rawNode as NodeObject;
    if (!node.x && node.x !== 0) return;

    // Fly camera to node
    const distance = 120;
    const mag = Math.hypot(node.x, node.y, node.z) || 1;
    const distRatio = 1 + distance / mag;
    graphRef.current?.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      { x: node.x, y: node.y, z: node.z },
      1200
    );

    // Open sidebar immediately, then load summary in background
    setSelectedNode(node);
    setSelectedSummary(null);
    setSidebarOpen(true);

    const titleForSummary = node.id.replace(/^Category:/, '');
    fetchPageSummary(titleForSummary)
      .then(summary => setSelectedSummary(summary))
      .catch(() => setSelectedSummary(null));

    // Expand category on click
    if (node.type === 'category' && !node.expanded) {
      markExpanded(node.id);
      const members = await fetchCategoryMembers(node.id);
      const newNodes: GraphNode[] = members.map(m => ({
        id: m.title,
        name: m.title.replace(/^Category:/, ''),
        type: m.ns === 14 ? 'category' : 'article',
        level: node.level + 1,
        val: m.ns === 14 ? 3 : 1,
        expanded: false,
      }));
      const newLinks: GraphLink[] = newNodes.map(n => ({
        source: node.id,
        target: n.id,
      }));
      addNodes(newNodes, newLinks);
    }
  }, [graphRef, setSelectedNode, setSelectedSummary, setSidebarOpen, markExpanded, addNodes]);

  const nodeThreeObject = useCallback((rawNode: object) => {
    const node = rawNode as GraphNode;
    const group = new THREE.Group();

    const radius = Math.cbrt(node.val ?? 1) * 4;

    // Core sphere
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
    group.add(new THREE.Mesh(geo, mat));

    // Glow halo
    const glowGeo = new THREE.SphereGeometry(radius * 1.8, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    // Text label for top-level and first-child categories
    if (node.level <= 1) {
      const sprite = new SpriteText(node.name);
      sprite.color = '#ffffff';
      sprite.textHeight = node.level === 0 ? 5 : 3.5;
      sprite.fontFace = 'Space Mono, monospace';
      sprite.backgroundColor = 'transparent';
      sprite.position.y = radius + 5;
      group.add(sprite);
    }

    return group;
  }, []);

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={graphData}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      nodeLabel={(node) => (node as GraphNode).name}
      onNodeClick={handleNodeClick}
      linkColor={() => 'rgba(255,255,255,0.12)'}
      linkWidth={0.4}
      linkOpacity={1}
      backgroundColor="#000000"
      showNavInfo={false}
    />
  );
}
