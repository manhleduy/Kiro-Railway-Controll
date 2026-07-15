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

  // Arrange in a grid-like pattern
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
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
        No stations to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
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
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>

        {/* Draw edges */}
        {stations.map((station) =>
          station.nextStations.map((next: Station) => {
            const from = positions[station.stationId];
            const to = positions[next.stationId];
            if (!from || !to) return null;

            // Shorten the line so it doesn't overlap the node circles
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
                stroke="#6b7280"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          }),
        )}

        {/* Draw nodes */}
        {stations.map((station) => {
          const pos = positions[station.stationId];
          if (!pos) return null;
          return (
            <g key={station.stationId}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill="#3b82f6"
                stroke="#1d4ed8"
                strokeWidth="2"
              />
              <text
                x={pos.x}
                y={pos.y - 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="600"
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
                fill="#374151"
                fontWeight="500"
              >
                {station.name}
              </text>
              <text
                x={pos.x}
                y={pos.y + NODE_RADIUS + 24}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
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
