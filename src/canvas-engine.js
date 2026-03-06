/**
 * Shared canvas rendering engine for NFT Split Pattern.
 * Used by both the editor preview and the frontend.
 */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTree(depth, cfg, seed) {
  const id = buildTree._counter++;
  const rng = mulberry32(id * 13397 + seed);
  const node = { depth, id };

  node.allCorners = rng() < cfg.allCornersChance;
  node.cornerIdx = Math.floor(rng() * 4);

  if (cfg.randomCurves) {
    node.curveA = cfg.curveMin + rng() * (cfg.curveMax - cfg.curveMin);
    node.curveB = cfg.curveMin + rng() * (cfg.curveMax - cfg.curveMin);
    node.curveTight = cfg.curveTight * (0.5 + rng());
  } else {
    const mid = (cfg.curveMin + cfg.curveMax) / 2;
    node.curveA = mid;
    node.curveB = mid;
    node.curveTight = cfg.curveTight;
  }

  if (depth >= cfg.maxDepth) {
    node.isLeaf = true;
    return node;
  }

  const splitRoll = rng();
  const splitRoll2 = rng();
  const range = cfg.splitMax - cfg.splitMin;
  node.hRatio = cfg.splitMin + rng() * range;
  node.vRatio = cfg.splitMin + rng() * range;
  node.isLeaf = false;

  if (depth === 0) {
    node.splitH = true;
    node.splitV = true;
  } else if (depth <= 2) {
    node.splitH = splitRoll < cfg.splitBias;
    node.splitV = splitRoll2 < cfg.splitBias;
    if (!node.splitH && !node.splitV) node.splitH = true;
  } else {
    node.splitH = splitRoll < cfg.splitBias * 0.79;
    node.splitV = splitRoll2 < cfg.splitBias * 0.79;
    if (!node.splitH && !node.splitV) {
      if (rng() < 0.5) node.splitH = true;
      else node.splitV = true;
    }
  }

  if (node.splitH && node.splitV) {
    node.children = [
      buildTree(depth + 1, cfg, seed),
      buildTree(depth + 1, cfg, seed),
      buildTree(depth + 1, cfg, seed),
      buildTree(depth + 1, cfg, seed),
    ];
  } else {
    node.children = [
      buildTree(depth + 1, cfg, seed),
      buildTree(depth + 1, cfg, seed),
    ];
  }

  return node;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function getLeafRects(node, x, y, w, h, progress, cfg) {
  if (w < 2 || h < 2) return [];

  if (node.isLeaf || progress <= 0) {
    return [
      {
        x,
        y,
        w,
        h,
        cornerIdx: node.cornerIdx,
        curveA: node.curveA,
        curveB: node.curveB,
        curveTight: node.curveTight,
        allCorners: node.allCorners,
      },
    ];
  }

  const depthDelay = node.depth * cfg.depthDelay;
  const localProgress = Math.max(
    0,
    Math.min(1, (progress - depthDelay) / (1 - depthDelay)),
  );

  if (localProgress <= 0) {
    return [
      {
        x,
        y,
        w,
        h,
        cornerIdx: node.cornerIdx,
        curveA: node.curveA,
        curveB: node.curveB,
        curveTight: node.curveTight,
        allCorners: node.allCorners,
      },
    ];
  }

  const gap = cfg.gap * easeOutCubic(localProgress);
  const hg = gap / 2;
  let rects = [];

  if (node.splitH && node.splitV) {
    const sx = w * node.vRatio,
      sy = h * node.hRatio;
    rects.push(
      ...getLeafRects(node.children[0], x, y, sx - hg, sy - hg, progress, cfg),
    );
    rects.push(
      ...getLeafRects(
        node.children[1],
        x + sx + hg,
        y,
        w - sx - hg,
        sy - hg,
        progress,
        cfg,
      ),
    );
    rects.push(
      ...getLeafRects(
        node.children[2],
        x,
        y + sy + hg,
        sx - hg,
        h - sy - hg,
        progress,
        cfg,
      ),
    );
    rects.push(
      ...getLeafRects(
        node.children[3],
        x + sx + hg,
        y + sy + hg,
        w - sx - hg,
        h - sy - hg,
        progress,
        cfg,
      ),
    );
  } else if (node.splitH) {
    const sy = h * node.hRatio;
    rects.push(
      ...getLeafRects(node.children[0], x, y, w, sy - hg, progress, cfg),
    );
    rects.push(
      ...getLeafRects(
        node.children[1],
        x,
        y + sy + hg,
        w,
        h - sy - hg,
        progress,
        cfg,
      ),
    );
  } else if (node.splitV) {
    const sx = w * node.vRatio;
    rects.push(
      ...getLeafRects(node.children[0], x, y, sx - hg, h, progress, cfg),
    );
    rects.push(
      ...getLeafRects(
        node.children[1],
        x + sx + hg,
        y,
        w - sx - hg,
        h,
        progress,
        cfg,
      ),
    );
  }

  return rects;
}

function bezierCorner(ctx, x, y, w, h, corner, cH, cV, t) {
  switch (corner) {
    case 0:
      ctx.moveTo(x + cH, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + cV);
      ctx.bezierCurveTo(x, y + cV * t, x + cH * t, y, x + cH, y);
      break;
    case 1:
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - cH, y);
      ctx.bezierCurveTo(x + w - cH * t, y, x + w, y + cV * t, x + w, y + cV);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      break;
    case 2:
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - cV);
      ctx.bezierCurveTo(
        x + w,
        y + h - cV * t,
        x + w - cH * t,
        y + h,
        x + w - cH,
        y + h,
      );
      ctx.lineTo(x, y + h);
      break;
    case 3:
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + cH, y + h);
      ctx.bezierCurveTo(x + cH * t, y + h, x, y + h - cV * t, x, y + h - cV);
      break;
  }
}

function drawShape(ctx, r) {
  const { x, y, w, h, cornerIdx, curveA, curveB, curveTight, allCorners } = r;
  if (w <= 1 || h <= 1) return;

  const cH = Math.min(curveA * w, w * 0.88);
  const cV = Math.min(curveB * h, h * 0.88);
  const t = Math.max(0.01, Math.min(curveTight, 0.5));

  ctx.beginPath();

  if (allCorners) {
    const cH4 = Math.min(curveA * w * 0.45, w * 0.45);
    const cV4 = Math.min(curveB * h * 0.45, h * 0.45);
    ctx.moveTo(x + cH4, y);
    ctx.lineTo(x + w - cH4, y);
    ctx.bezierCurveTo(x + w - cH4 * t, y, x + w, y + cV4 * t, x + w, y + cV4);
    ctx.lineTo(x + w, y + h - cV4);
    ctx.bezierCurveTo(
      x + w,
      y + h - cV4 * t,
      x + w - cH4 * t,
      y + h,
      x + w - cH4,
      y + h,
    );
    ctx.lineTo(x + cH4, y + h);
    ctx.bezierCurveTo(x + cH4 * t, y + h, x, y + h - cV4 * t, x, y + h - cV4);
    ctx.lineTo(x, y + cV4);
    ctx.bezierCurveTo(x, y + cV4 * t, x + cH4 * t, y, x + cH4, y);
  } else {
    bezierCorner(ctx, x, y, w, h, cornerIdx, cH, cV, t);
  }

  ctx.closePath();
  ctx.fill();
}

/**
 * Main render function. Call from requestAnimationFrame loop.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object}           attrs  Block attributes
 * @param {Object}           state  Mutable state { mouseProgress, targetProgress, tree, lastSeed, lastCfgKey }
 */
export function renderCanvas(canvas, attrs, state) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cfg = {
    gap: attrs.gap,
    maxDepth: attrs.maxDepth,
    padding: attrs.padding,
    curveMin: attrs.curveMin,
    curveMax: attrs.curveMax,
    curveTight: attrs.curveTight,
    randomCurves: attrs.randomCurves,
    allCornersChance: attrs.allCornersChance,
    splitBias: attrs.splitBias,
    splitMin: attrs.splitMin,
    splitMax: attrs.splitMax,
    depthDelay: attrs.depthDelay,
    easeSpeed: attrs.easeSpeed,
    mousePower: attrs.mousePower,
  };

  // Rebuild tree when seed or structure-affecting settings change
  const cfgKey = JSON.stringify([
    attrs.seed,
    cfg.maxDepth,
    cfg.splitBias,
    cfg.splitMin,
    cfg.splitMax,
    cfg.curveMin,
    cfg.curveMax,
    cfg.curveTight,
    cfg.randomCurves,
    cfg.allCornersChance,
    cfg.padding,
  ]);

  if (state.lastCfgKey !== cfgKey || !state.tree) {
    buildTree._counter = 0;
    state.tree = buildTree(0, cfg, attrs.seed);
    state.lastCfgKey = cfgKey;
  }

  // Ease animation
  const diff = state.targetProgress - state.mouseProgress;
  if (Math.abs(diff) > 0.001) {
    state.mouseProgress += diff * cfg.easeSpeed * (diff > 0 ? 2.5 : 1.5);
  } else {
    state.mouseProgress = state.targetProgress;
  }

  // Clear / background — always clear first so alpha works correctly
  ctx.clearRect(0, 0, w, h);
  if (attrs.bgColor) {
    ctx.fillStyle = attrs.bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  // Compute padded rect
  const pad = Math.min(w, h) * cfg.padding;
  const rect = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

  const rects = getLeafRects(
    state.tree,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    state.mouseProgress,
    cfg,
  );

  if (attrs.shapeColor) {
    ctx.fillStyle = attrs.shapeColor;
    for (const r of rects) drawShape(ctx, r);
  }
}
