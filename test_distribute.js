const fs = require('fs');

function distributePoints(polygon, numPoints) {
  if (!polygon || polygon.length < 2) return [];
  if (numPoints <= 0) return [];
  if (numPoints === 1) return [polygon[0]];
  let totalLength = 0;
  const segments = [];
  for (let i = 0; i < polygon.length - 1; i += 2) {
    const p1 = polygon[i], p2 = polygon[i + 1];
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const len = Math.sqrt(dx*dx + dy*dy);
    segments.push({ p1, p2, len, dx, dy });
    totalLength += len;
  }
  const step = totalLength / numPoints;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const targetDist = i * step;
    let accumulated = 0, found = false;
    for (const seg of segments) {
      if (accumulated + seg.len >= targetDist) {
        const ratio = seg.len === 0 ? 0 : (targetDist - accumulated) / seg.len;
        points.push([seg.p1[0] + seg.dx * ratio, seg.p1[1] + seg.dy * ratio]);
        found = true; break;
      }
      accumulated += seg.len;
    }
    if (!found) points.push([...segments[segments.length - 1].p2]);
  }
  return points;
}

try {
  // simulate shape data
  const poly = [ [0,0], [1,1], [1,1], [2,2] ];
  const res = distributePoints(poly, 5);
  console.log("Success:", res);
} catch (e) {
  console.log("Error:", e.stack);
}
