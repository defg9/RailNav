import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useLang } from '../context/LangContext';

// Type → icon + color only (labels come from locale at render time)
const TYPE_META = {
  platform:  { icon: '🚆', color: '#6366f1' },
  restroom:  { icon: '🚻', color: '#0ea5e9' },
  food:      { icon: '🍔', color: '#f97316' },
  entrance:  { icon: '🚪', color: '#22c55e' },
  exit:      { icon: '🚪', color: '#22c55e' },
  ticket:    { icon: '🎫', color: '#eab308' },
  helpdesk:  { icon: 'ℹ️', color: '#8b5cf6' },
  stairs:    { icon: '📶', color: '#94a3b8' },
  lift:      { icon: '🛗', color: '#10b981' },
  ramp:      { icon: '♿', color: '#14b8a6' },
  waiting:   { icon: '💺', color: '#ec4899' },
  parking:   { icon: '🅿️', color: '#64748b' },
  waypoint:  { icon: '📍', color: '#94a3b8' },
};

// Keys that appear in the legend (exclude duplicate 'exit')
const LEGEND_TYPES = ['platform','restroom','food','entrance','ticket','helpdesk','stairs','lift','ramp','waiting','parking','waypoint'];

const MIN_SCALE = 0.3;
const MAX_SCALE = 8.0;
const LABEL_ZOOM_THRESHOLD = 1.2;

function getMeta(type) {
  return TYPE_META[type] || TYPE_META.waypoint;
}

export default function MapViewer({ nodes = [], edges = [], routePath, activeStepIndex, floor, setFloor }) {
  const { lang, t } = useLang();
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  // ── pan / zoom state ────────────────────────────────────────────────────────
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(false);
  const dragStart = useRef({ clientX: 0, clientY: 0, tx: 0, ty: 0 });

  // ── fitted bounding box ─────────────────────────────────────────────────────
  const nodeBounds = useMemo(() => {
    const validNodes = nodes.filter(n => Number.isFinite(n?.x) && Number.isFinite(n?.y));
    if (validNodes.length === 0) {
      return { minX: 0, minY: 0, width: 800, height: 600, centerX: 400, centerY: 300 };
    }
    const pad = 40;
    const xs = validNodes.map(n => n.x);
    const ys = validNodes.map(n => n.y);
    const rawMinX = Math.min(...xs);
    const rawMaxX = Math.max(...xs);
    const rawMinY = Math.min(...ys);
    const rawMaxY = Math.max(...ys);

    const minX = rawMinX - pad;
    const minY = rawMinY - pad;
    const width = Math.max(1, (rawMaxX - rawMinX) + pad * 2);
    const height = Math.max(1, (rawMaxY - rawMinY) + pad * 2);
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    return { minX, minY, width, height, centerX, centerY };
  }, [nodes]);

  const viewBox = useMemo(() => {
    return `${nodeBounds.minX} ${nodeBounds.minY} ${nodeBounds.width} ${nodeBounds.height}`;
  }, [nodeBounds]);

  // Restore fitted view
  const resetView = useCallback(() => {
    setViewTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // Reset view when station nodes change (React recommended pattern for adjusting state from props)
  const [prevNodes, setPrevNodes] = useState(nodes);
  if (nodes !== prevNodes) {
    setPrevNodes(nodes);
    setViewTransform({ x: 0, y: 0, scale: 1 });
  }

  // Translate client coordinate (clientX, clientY) to SVG root coordinate space
  const getSvgCoordinates = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) {
      return { x: nodeBounds.centerX, y: nodeBounds.centerY };
    }
    try {
      if (typeof svg.getScreenCTM === 'function') {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = clientX;
          pt.y = clientY;
          const svgPt = pt.matrixTransform(ctm.inverse());
          if (Number.isFinite(svgPt.x) && Number.isFinite(svgPt.y)) {
            return { x: svgPt.x, y: svgPt.y };
          }
        }
      }
    } catch {
      // Fallback below
    }

    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      const x = nodeBounds.minX + px * nodeBounds.width;
      const y = nodeBounds.minY + py * nodeBounds.height;
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return { x, y };
      }
    }

    return { x: nodeBounds.centerX, y: nodeBounds.centerY };
  }, [nodeBounds]);

  // Zoom centered at mouse position
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const mouse = getSvgCoordinates(e.clientX, e.clientY);

    setViewTransform(prev => {
      const currentScale = Number.isFinite(prev.scale) && prev.scale > 0 ? prev.scale : 1;
      const currentX = Number.isFinite(prev.x) ? prev.x : 0;
      const currentY = Number.isFinite(prev.y) ? prev.y : 0;

      const targetScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, currentScale * factor));
      if (Math.abs(targetScale - currentScale) < 0.0001) {
        return prev;
      }

      // Keep point under mouse fixed in SVG space:
      // mouse.x = currentX + currentScale * pX = newX + targetScale * pX
      const ratio = targetScale / currentScale;
      const newX = mouse.x - ratio * (mouse.x - currentX);
      const newY = mouse.y - ratio * (mouse.y - currentY);

      if (!Number.isFinite(newX) || !Number.isFinite(newY) || !Number.isFinite(targetScale)) {
        return { x: 0, y: 0, scale: 1 };
      }

      return { x: newX, y: newY, scale: targetScale };
    });
  }, [getSvgCoordinates]);

  // Pan dragging
  const onMouseDown = useCallback((e) => {
    if (e.target.closest('.map-node-group')) return; // don't drag on node click
    if (e.button !== 0) return;
    dragging.current = true;
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      tx: Number.isFinite(viewTransform.x) ? viewTransform.x : 0,
      ty: Number.isFinite(viewTransform.y) ? viewTransform.y : 0,
    };
  }, [viewTransform]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.clientX;
    const dy = e.clientY - dragStart.current.clientY;

    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const svgRatio = (rect && rect.width > 0) ? (nodeBounds.width / rect.width) : 1;

    const nextX = dragStart.current.tx + dx * svgRatio;
    const nextY = dragStart.current.ty + dy * svgRatio;

    if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) {
      setViewTransform({ x: 0, y: 0, scale: 1 });
      return;
    }

    setViewTransform(v => ({ ...v, x: nextX, y: nextY }));
  }, [nodeBounds.width]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Transform guarded against NaN / Infinity
  const safeTransform = useMemo(() => {
    const { x, y, scale } = viewTransform;
    if (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Number.isFinite(scale) &&
      scale >= MIN_SCALE &&
      scale <= MAX_SCALE
    ) {
      return { x, y, scale };
    }
    return { x: 0, y: 0, scale: 1 };
  }, [viewTransform]);

  // ── node tooltip handlers (guarded against redundant state updates) ─────────
  const handleNodeMouseEnter = useCallback((node, e) => {
    setTooltip(prev => {
      if (prev?.id === node.id) return prev;
      const rect = svgRef.current?.getBoundingClientRect();
      const px = rect ? e.clientX - rect.left : 0;
      const py = rect ? e.clientY - rect.top : 0;
      return { ...node, px, py };
    });
  }, []);

  const handleNodeMouseLeave = useCallback((nodeId) => {
    setTooltip(prev => (prev?.id === nodeId ? null : prev));
  }, []);

  // ── derived data ─────────────────────────────────────────────────────────────
  const floors = useMemo(() => [...new Set(nodes.map(n => n.floor))].sort((a, b) => a - b), [nodes]);
  const floorNodes = useMemo(() => nodes.filter(n => n.floor === floor), [nodes, floor]);

  // Route node ids for current floor
  const routeNodeIds = useMemo(() => new Set((routePath || []).map(n => n.id)), [routePath]);
  const activeNodeId = routePath && activeStepIndex >= 0 ? routePath[activeStepIndex]?.id : null;

  // Route segments
  const routeSegments = useMemo(() => {
    if (!routePath || routePath.length < 2) return [];
    const segs = [];
    for (let i = 0; i < routePath.length - 1; i++) {
      const a = routePath[i];
      const b = routePath[i + 1];
      if (a.floor === floor && b.floor === floor) {
        segs.push({ a, b, active: i === activeStepIndex });
      }
    }
    return segs;
  }, [routePath, floor, activeStepIndex]);

  // ── memoized SVG layers (isolated from tooltip state re-renders) ─────────────
  const renderedEdges = useMemo(() => {
    return edges.map(edge => {
      const fn = nodes.find(n => n.id === edge.from_node);
      const tn = nodes.find(n => n.id === edge.to_node);
      if (!fn || !tn) return null;
      if (fn.floor !== floor && tn.floor !== floor) return null;
      return (
        <line
          key={edge.id}
          x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y}
          className={`map-edge ${edge.has_stairs ? 'edge-stairs' : ''} ${!edge.is_accessible ? 'edge-inaccessible' : ''}`}
          style={{ pointerEvents: 'none' }}
        />
      );
    });
  }, [edges, nodes, floor]);

  const renderedRoute = useMemo(() => {
    return routeSegments.map(({ a, b, active }, i) => (
      <line
        key={`rs-${i}`}
        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        className={`map-route-line ${active ? 'active-step' : ''}`}
        style={{ pointerEvents: 'none' }}
      />
    ));
  }, [routeSegments]);

  const renderedNodes = useMemo(() => {
    return floorNodes.map(node => {
      const meta = getMeta(node.type);
      const isOnRoute = routeNodeIds.has(node.id);
      const isActive = node.id === activeNodeId;
      return (
        <g
          key={node.id}
          className="map-node-group"
          transform={`translate(${node.x},${node.y})`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => handleNodeMouseEnter(node, e)}
          onMouseLeave={() => handleNodeMouseLeave(node.id)}
        >
          {/* Pulse ring for active node (decorative, pointer-events: none) */}
          {isActive && <circle cx="0" cy="0" r="10" className="node-pulse" style={{ pointerEvents: 'none' }} />}
          {/* Highlight ring for route nodes (decorative, pointer-events: none) */}
          {isOnRoute && !isActive && <circle cx="0" cy="0" r="7" className="node-on-route" style={{ pointerEvents: 'none' }} />}
          {/* Node circle (decorative, pointer-events: none) */}
          <circle
            cx="0" cy="0" r="5"
            className="node-bg"
            style={{ stroke: meta.color, pointerEvents: 'none' }}
          />
          {/* Icon (decorative, pointer-events: none) */}
          <text x="0" y="1.5" className="node-icon" textAnchor="middle" style={{ pointerEvents: 'none' }}>
            {meta.icon}
          </text>
          {/* Single stable hit-area circle receives all pointer events */}
          <circle
            cx="0" cy="0" r="8"
            className="node-hit-area"
            style={{ pointerEvents: 'all' }}
          />
        </g>
      );
    });
  }, [floorNodes, routeNodeIds, activeNodeId, handleNodeMouseEnter, handleNodeMouseLeave]);

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="map-container glass-panel">
      {/* Floor switcher */}
      <div className="map-controls">
        {floors.map(f => (
          <button
            key={f}
            className={`floor-btn ${floor === f ? 'active' : ''}`}
            onClick={() => { setFloor(f); resetView(); }}
          >
            {f === 0 ? t('map.ground') : `${t('map.floor')} ${f}`}
          </button>
        ))}
        <button className="floor-btn reset-btn" onClick={resetView} title={t('map.resetView')}>⟳</button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="node-tooltip"
          style={{ left: tooltip.px + 12, top: tooltip.py - 8, pointerEvents: 'none' }}
        >
          <strong>{lang === 'hi' && tooltip.name_hi ? tooltip.name_hi : tooltip.name}</strong>
          {tooltip.name_hi && lang === 'en' && <span className="tooltip-hi"> · {tooltip.name_hi}</span>}
          <br />
          <span className="tooltip-type">{t(`map.legend.${tooltip.type}`)} · {tooltip.floor === 0 ? t('map.ground') : `${t('map.floor')} ${tooltip.floor}`}</span>
        </div>
      )}

      {/* SVG */}
      <svg
        ref={svgRef}
        className="map-svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${safeTransform.x},${safeTransform.y}) scale(${safeTransform.scale})`}>
          {/* Background grid (subtle) */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" />

          {/* Edges */}
          {renderedEdges}

          {/* Route overlay */}
          {renderedRoute}

          {/* Nodes */}
          {renderedNodes}

          {/* Node Labels Layer: rendered after all icons/circles and edges */}
          <g className="map-labels-layer" style={{ pointerEvents: 'none' }}>
            {floorNodes.map(node => {
              const isOnRoute = routeNodeIds.has(node.id);
              const isStartOrDest = Boolean(
                routePath && routePath.length > 0 &&
                (node.id === routePath[0]?.id || node.id === routePath[routePath.length - 1]?.id)
              );
              const isHovered = tooltip?.id === node.id;
              const shouldShowLabel =
                viewTransform.scale >= LABEL_ZOOM_THRESHOLD ||
                isOnRoute ||
                isStartOrDest ||
                isHovered;

              if (!shouldShowLabel) return null;

              return (
                <text
                  key={`label-${node.id}`}
                  x={node.x}
                  y={node.y - 8}
                  className="node-label"
                  textAnchor="middle"
                >
                  {lang === 'hi' && node.name_hi ? node.name_hi : node.name}
                </text>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Legend */}
      <div className="map-legend">
        {LEGEND_TYPES.map(type => (
          <div key={type} className="legend-item">
            <span>{TYPE_META[type].icon}</span>
            <span>{t(`map.legend.${type}`)}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-line route" />
          <span>{t('map.legend.route')}</span>
        </div>
      </div>

      {/* Hint */}
      <div className="map-hint">{t('map.dragHint')}</div>
    </div>
  );
}
