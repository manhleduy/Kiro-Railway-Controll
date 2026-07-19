import { useId } from 'react';
import type { Station } from '@/types';
import { CENTRAL_STATION_ID } from '@/features/stations/station-routing';

interface StationGraphProps {
  stations: Station[];
  centerStationId?: string;
  highlightedStationIds?: string[];
}

interface NodePosition {
  x: number;
  y: number;
}

const NODE_RADIUS = 24;
const WIDTH = 860;
const HEIGHT = 560;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function buildLevels(stations: Station[], centerStationId: string): Map<string, number> {
  const adjacency = new Map<string, string[]>();
  stations.forEach((station) => {
    adjacency.set(
      station.stationId,
      uniqueIds(station.nextStations.map((nextStation) => nextStation.stationId)),
    );
  });

  const levels = new Map<string, number>([[centerStationId, 0]]);
  const queue: string[] = [centerStationId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const currentLevel = levels.get(current) ?? 0;
    for (const nextStationId of adjacency.get(current) ?? []) {
      if (levels.has(nextStationId)) continue;
      levels.set(nextStationId, currentLevel + 1);
      queue.push(nextStationId);
    }
  }

  return levels;
}

function layoutNodes(stations: Station[], centerStationId: string): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const centerStation =
    stations.find((station) => station.stationId === centerStationId) ?? stations[0];

  if (!centerStation) {
    return positions;
  }

  positions[centerStation.stationId] = {
    x: CENTER_X,
    y: CENTER_Y,
  };

  const levels = buildLevels(stations, centerStation.stationId);
  const grouped = new Map<number, Station[]>();

  stations.forEach((station) => {
    if (station.stationId === centerStation.stationId) {
      return;
    }

    const level = levels.get(station.stationId) ?? 8;
    const bucket = grouped.get(level) ?? [];
    bucket.push(station);
    grouped.set(level, bucket);
  });

  const sortedLevels = [...grouped.keys()].sort((a, b) => a - b);
  const baseRadius = 130;
  const radiusStep = 92;

  sortedLevels.forEach((level) => {
    const ringStations = grouped.get(level) ?? [];
    const radius = baseRadius + (level - 1) * radiusStep;
    const angleStep = (Math.PI * 2) / Math.max(ringStations.length, 1);
    const angleOffset = level % 2 === 0 ? -Math.PI / 2 : -Math.PI / 3;

    ringStations.forEach((station, index) => {
      const angle = angleOffset + angleStep * index;
      positions[station.stationId] = {
        x: CENTER_X + Math.cos(angle) * radius,
        y: CENTER_Y + Math.sin(angle) * radius,
      };
    });
  });

  return positions;
}

export function StationGraph({
  stations,
  centerStationId = CENTRAL_STATION_ID,
  highlightedStationIds = [],
}: StationGraphProps) {
  const uid = useId().replace(/:/g, '');
  const resolvedCenterStation =
    stations.find((station) => station.stationId === centerStationId) ?? stations[0];
  const resolvedCenterStationId = resolvedCenterStation?.stationId ?? centerStationId;
  const positions = layoutNodes(stations, resolvedCenterStationId);
  const highlighted = new Set(highlightedStationIds);
  const highlightedEdges = new Set(
    highlightedStationIds.slice(0, -1).map((stationId, index) => {
      const nextStationId = highlightedStationIds[index + 1];
      return `${stationId}->${nextStationId}`;
    }),
  );

  if (stations.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        No stations to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ minWidth: '720px', maxHeight: '560px' }}
        aria-label="Station network graph"
      >
        <defs>
          <marker
            id={`arrowhead-${uid}`}
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" />
          </marker>
          <linearGradient id={`stationNodeGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id={`centerNodeGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
          <linearGradient id={`highlightNodeGradient-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <radialGradient id={`hubGlow-${uid}`}>
            <stop offset="0%" stopColor="rgba(249,115,22,0.18)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="#f8fafc" />
        <circle cx={CENTER_X} cy={CENTER_Y} r="150" fill={`url(#hubGlow-${uid})`} />

        {stations.map((station) =>
          station.nextStations.map((nextStation: Station) => {
            const from = positions[station.stationId];
            const to = positions[nextStation.stationId];
            if (!from || !to) return null;

            const edgeKey = `${station.stationId}->${nextStation.stationId}`;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;

            const scale = NODE_RADIUS / dist;
            const x1 = from.x + dx * scale;
            const y1 = from.y + dy * scale;
            const x2 = to.x - dx * scale;
            const y2 = to.y - dy * scale;
            const isHighlighted = highlightedEdges.has(edgeKey);

            return (
              <line
                key={edgeKey}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isHighlighted ? '#f59e0b' : '#94a3b8'}
                strokeWidth={isHighlighted ? '3.5' : '2'}
                strokeDasharray={isHighlighted ? undefined : '4 4'}
                markerEnd={`url(#arrowhead-${uid})`}
              />
            );
          }),
        )}

        {stations.map((station) => {
          const pos = positions[station.stationId];
          if (!pos) return null;

          const isCenter = station.stationId === resolvedCenterStationId;
          const isHighlighted = highlighted.has(station.stationId);
          const outerRadius = isCenter ? NODE_RADIUS + 12 : isHighlighted ? NODE_RADIUS + 8 : NODE_RADIUS + 5;
          const fill = isCenter
            ? `url(#centerNodeGradient-${uid})`
            : isHighlighted
              ? `url(#highlightNodeGradient-${uid})`
              : `url(#stationNodeGradient-${uid})`;

          return (
            <g key={station.stationId}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={outerRadius}
                fill={isCenter ? 'rgba(249,115,22,0.14)' : isHighlighted ? 'rgba(245,158,11,0.12)' : 'rgba(56,189,248,0.10)'}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={fill}
                stroke={isCenter ? '#c2410c' : isHighlighted ? '#d97706' : '#1d4ed8'}
                strokeWidth="2"
              />
              <text
                x={pos.x}
                y={pos.y - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="700"
                fill="white"
              >
                {station.stationId.length > 7
                  ? station.stationId.slice(0, 7)
                  : station.stationId}
              </text>
              <text
                x={pos.x}
                y={pos.y + NODE_RADIUS + 12}
                textAnchor="middle"
                fontSize="11"
                fill="#0f172a"
                fontWeight="600"
              >
                {station.name}
              </text>
              <text
                x={pos.x}
                y={pos.y + NODE_RADIUS + 24}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {station.location}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
