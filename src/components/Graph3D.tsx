import ForceGraph3D from 'react-force-graph-3d';
import { useRef, useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { useGraphStore } from '../store/graphStore';
import { fetchCategoryMembers, fetchArticleLinks } from '../services/wikipedia';
import type { GraphNode, GraphLink } from '../types/graph';
import { childDiskPositions, clusterCamera } from '../utils/layout';
import { fetchSummaryWithFallback } from '../utils/fetchSummary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FGRef = any;

interface NodeObject extends GraphNode {
  x: number;
  y: number;
  z: number;
}

const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
const glowMat = new THREE.MeshBasicMaterial({
  color: 0xffffff, transparent: true, opacity: 0.06,
  side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
});

const geoCache = new Map<string, THREE.SphereGeometry>();
function getSphereGeo(radius: number, isGlow: boolean): THREE.SphereGeometry {
  const key = `${radius.toFixed(1)}-${isGlow ? 'g' : 'c'}`;
  if (!geoCache.has(key)) {
    const segs = radius > 6 ? 14 : 8;
    geoCache.set(key, new THREE.SphereGeometry(radius, segs, segs));
  }
  return geoCache.get(key)!;
}

function spreadForLevel(level: number): number {
  return Math.max(45, 130 - level * 25);
}

export default function Graph3D() {
  const graphRef = useRef<FGRef>(null);
  const hasZoomed = useRef(false);

  const {
    nodes, links,
    addNodes, setSelectedNode, setSelectedSummary, setSummaryError,
    setSidebarOpen, markExpanded,
    flyToId, setFlyToId,
  } = useGraphStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const graphData = useMemo(() => ({ nodes, links }), [nodes.length, links.length]);

  // Zoom to fit seeds once they load
  useEffect(() => {
    if (nodes.length > 0 && !hasZoomed.current) {
      const t = setTimeout(() => {
        graphRef.current?.zoomToFit(800, 120);
        hasZoomed.current = true;
      }, 100);
      return () => clearTimeout(t);
    }
  }, [nodes.length]);

  // Fly to a search result's cluster after children have been added and rendered
  useEffect(() => {
    if (!flyToId) return;
    const target = nodes.find(nd => nd.id === flyToId);
    const t = setTimeout(() => {
      setFlyToId(null);
      if (!target) return;
      const x = target.fx ?? target.x ?? 0;
      const y = target.fy ?? target.y ?? 0;
      const z = target.fz ?? target.z ?? 0;
      const spread = spreadForLevel(0);
      const { pos, lookAt } = clusterCamera(x, y, z, spread, 3.2);
      graphRef.current?.cameraPosition(pos, lookAt, 900);
    }, 250);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToId, setFlyToId]);

  const handleNodeClick = useCallback(async (rawNode: object) => {
    const node = rawNode as NodeObject;
    const x = node.fx ?? node.x ?? 0;
    const y = node.fy ?? node.y ?? 0;
    const z = node.fz ?? node.z ?? 0;
    const mag = Math.hypot(x, y, z) || 1;

    // Fly to node
    graphRef.current?.cameraPosition(
      { x: x * (1 + 100 / mag), y: y * (1 + 100 / mag), z: z * (1 + 100 / mag) },
      { x, y, z },
      600
    );

    setSelectedNode(node);
    setSelectedSummary(null);
    setSidebarOpen(true);
    fetchSummaryWithFallback(node.id)
      .then(s => s ? setSelectedSummary(s) : setSummaryError(true))
      .catch(() => setSummaryError(true));

    if (!node.expanded) {
      markExpanded(node.id);

      let rawMembers: Array<{ title: string; ns: number }> = [];
      if (node.type === 'category') {
        rawMembers = await fetchCategoryMembers(node.id);
      } else {
        const articleLinks = await fetchArticleLinks(node.id);
        rawMembers = articleLinks.map(l => ({ title: l.title, ns: 0 }));
      }
      if (rawMembers.length === 0) return;

      const spread = spreadForLevel(node.level);
      // Disk layout: children face outward — always visible from camera
      const positions = childDiskPositions(rawMembers.length, x, y, z, spread);

      const newNodes: GraphNode[] = rawMembers.map((m, i) => ({
        id: m.title,
        name: m.title.replace(/^Category:/, ''),
        type: m.ns === 14 ? 'category' : 'article',
        level: node.level + 1,
        val: m.ns === 14 ? 3 : 1,
        expanded: false,
        x: positions[i].x, y: positions[i].y, z: positions[i].z,
        fx: positions[i].x, fy: positions[i].y, fz: positions[i].z,
      }));

      const newLinks: GraphLink[] = newNodes.map(n => ({
        source: node.id,
        target: n.id,
      }));

      addNodes(newNodes, newLinks);

      // Move camera to frame the cluster — look at its centroid, not the parent
      const { pos, lookAt } = clusterCamera(x, y, z, spread, 3.2);
      graphRef.current?.cameraPosition(pos, lookAt, 900);
    }
  }, [graphRef, setSelectedNode, setSelectedSummary, setSidebarOpen, markExpanded, addNodes]);

  const nodeThreeObject = useCallback((rawNode: object) => {
    const node = rawNode as GraphNode;
    const group = new THREE.Group();
    const radius = Math.cbrt(node.val ?? 1) * 4;

    group.add(new THREE.Mesh(getSphereGeo(radius, false), coreMat));
    if ((node.val ?? 1) > 1) {
      group.add(new THREE.Mesh(getSphereGeo(radius * 1.8, true), glowMat));
    }

    if (node.level <= 1) {
      const sprite = new SpriteText(node.name);
      sprite.color = '#ffffff';
      sprite.textHeight = node.level === 0 ? 5 : 3;
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
      warmupTicks={0}
      cooldownTicks={0}
      linkColor={() => '#ffffff'}
      linkOpacity={0.15}
      linkWidth={0.5}
      linkDirectionalParticles={1}
      linkDirectionalParticleSpeed={0.004}
      linkDirectionalParticleWidth={1.2}
      backgroundColor="#000000"
      showNavInfo={false}
    />
  );
}
