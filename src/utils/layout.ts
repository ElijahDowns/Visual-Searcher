// Evenly distribute N points on a sphere using Fibonacci lattice
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

// Place children in a disk that faces OUTWARD from the graph centre.
// This guarantees children are always in front of the parent from any outward-looking camera.
export function childDiskPositions(
  count: number,
  cx: number, cy: number, cz: number,
  spread: number
) {
  const mag = Math.hypot(cx, cy, cz) || 1;

  // Unit vector pointing outward from origin through parent
  const ox = cx / mag, oy = cy / mag, oz = cz / mag;

  // Build two basis vectors perpendicular to the outward direction
  const upRef = Math.abs(oy) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let ux = oy * upRef[2] - oz * upRef[1];
  let uy = oz * upRef[0] - ox * upRef[2];
  let uz = ox * upRef[1] - oy * upRef[0];
  const uMag = Math.hypot(ux, uy, uz) || 1;
  ux /= uMag; uy /= uMag; uz /= uMag;
  // v = outward × u
  const vx = oy * uz - oz * uy;
  const vy = oz * ux - ox * uz;
  const vz = ox * uy - oy * ux;

  // Push the whole cluster outward from the parent so it doesn't overlap it
  const outOffset = spread * 0.8;

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    // Arrange in concentric rings of 8; inner ring is tighter
    const ring = Math.floor(i / 8);
    const diskR = spread * (0.3 + ring * 0.45);
    return {
      x: cx + ox * outOffset + (ux * Math.cos(angle) + vx * Math.sin(angle)) * diskR,
      y: cy + oy * outOffset + (uy * Math.cos(angle) + vy * Math.sin(angle)) * diskR,
      z: cz + oz * outOffset + (uz * Math.cos(angle) + vz * Math.sin(angle)) * diskR,
    };
  });
}

// The camera position to frame a cluster: sit along the outward direction,
// far enough to see all children, looking at the cluster centroid.
export function clusterCamera(
  cx: number, cy: number, cz: number,
  spread: number,
  distMult = 3.5
) {
  const mag = Math.hypot(cx, cy, cz) || 1;
  const ox = cx / mag, oy = cy / mag, oz = cz / mag;
  const outOffset = spread * 0.8;
  // Centroid of the cluster (slightly outward from parent)
  const lx = cx + ox * outOffset;
  const ly = cy + oy * outOffset;
  const lz = cz + oz * outOffset;
  const pullDist = spread * distMult;
  return {
    pos: { x: lx + ox * pullDist, y: ly + oy * pullDist, z: lz + oz * pullDist },
    lookAt: { x: lx, y: ly, z: lz },
  };
}
