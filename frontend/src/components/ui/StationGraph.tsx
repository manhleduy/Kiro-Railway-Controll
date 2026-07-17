import type { Station } from '@/types';

interface StationGraphProps {
  stations: Station[];
}

interface NodePosition {
  x: number;
  y: number;
}

const NODE_RADIUS = 24;
const WIDTH = 700;
const HEIGHT = 420;

function layoutNodes(stations: Station[]): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const count = stations.length;
  if (count === 0) return positions;

  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const colGap = WIDTH / (cols + 1);
  const rowGap = HEIGHT / (rows + 1);

  stations.forEach((station, i) => {
    const col = (i % cols) + 1;
    const row = Math.floor(i / cols) + 1;
    positions[station.stationId] = {
      x: col * colGap,
      y: row * rowGap,
    };
  });

  return positions;
}

export function StationGraph({ stations }: StationGraphProps) {
  const positions = layoutNodes(stations);

  if (stations.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        No stations to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white/80 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ minWidth: '500px', maxHeight: '420px' }}
        aria-label="Station network graph"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" />
          </marker>
          <linearGradient id="stationNodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {stations.map((station) =>
          station.nextStations.map((next: Station) => {
            const from = positions[station.stationId];
            const to = positions[next.stationId];
            if (!from || !to) return null;

            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;
            const scale = NODE_RADIUS / dist;
            const x1 = from.x + dx * scale;
            const y1 = from.y + dy * scale;
            const x2 = to.x - dx * scale;
            const y2 = to.y - dy * scale;

            return (
              <line
                key={`${station.stationId}-${next.stationId}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#arrowhead)"
              />
            );
          }),
        )}

        {stations.map((station) => {
          const pos = positions[station.stationId];
          if (!pos) return null;

          return (
            <g key={station.stationId}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS + 5}
                fill="rgba(56,189,248,0.12)"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill="url(#stationNodeGradient)"
                stroke="#1d4ed8"
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
                {station.stationId.length > 6
                  ? station.stationId.slice(0, 6)
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
