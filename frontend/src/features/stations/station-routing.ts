import type { Station } from '@/types';

export const CENTRAL_STATION_ID = 'VN1000';

export interface StationRouteResult {
  target: Station;
  path: Station[];
  hops: number;
  isDirect: boolean;
  isSameStation: boolean;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

export function searchStationMatches(
  stations: Station[],
  query: string,
  limit = 5,
): Station[] {
  const normalized = normalize(query);
  if (!normalized) return [];

  const matches = stations.filter((station) => {
    const haystack = [station.stationId, station.name, station.location]
      .map(normalize)
      .join(' ');
    return haystack.includes(normalized);
  });

  const exactId = matches.find((station) => normalize(station.stationId) === normalized);
  const exactName = matches.find((station) => normalize(station.name) === normalized);
  const exactLocation = matches.find(
    (station) => normalize(station.location) === normalized,
  );

  const ordered = uniqueIds([
    exactId?.stationId ?? '',
    exactName?.stationId ?? '',
    exactLocation?.stationId ?? '',
    ...matches.map((station) => station.stationId),
  ])
    .filter(Boolean)
    .map((stationId) => stations.find((station) => station.stationId === stationId))
    .filter((station): station is Station => Boolean(station));

  return ordered.slice(0, limit);
}

export function findStationMatch(
  stations: Station[],
  query: string,
): Station | null {
  const normalized = normalize(query);
  if (!normalized) return null;

  const exactId = stations.find((station) => normalize(station.stationId) === normalized);
  if (exactId) return exactId;

  const exactName = stations.find((station) => normalize(station.name) === normalized);
  if (exactName) return exactName;

  const exactLocation = stations.find(
    (station) => normalize(station.location) === normalized,
  );
  if (exactLocation) return exactLocation;

  return (
    searchStationMatches(stations, query, 1)[0] ?? null
  );
}

export function planRoute(
  stations: Station[],
  startStationId: string,
  targetStationId: string,
): StationRouteResult | null {
  const stationMap = new Map(stations.map((station) => [station.stationId, station]));
  const start = stationMap.get(startStationId);
  const target = stationMap.get(targetStationId);

  if (!start || !target) {
    return null;
  }

  if (startStationId === targetStationId) {
    return {
      target,
      path: [start],
      hops: 0,
      isDirect: true,
      isSameStation: true,
    };
  }

  const adjacency = new Map<string, string[]>();
  for (const station of stations) {
    const nextIds = uniqueIds(
      station.nextStations
        .map((nextStation) => nextStation.stationId)
        .filter((stationId) => stationMap.has(stationId)),
    );
    adjacency.set(station.stationId, nextIds);
  }

  const queue: string[] = [startStationId];
  const visited = new Set<string>([startStationId]);
  const previous = new Map<string, string | null>([[startStationId, null]]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (current === targetStationId) {
      break;
    }

    for (const nextStationId of adjacency.get(current) ?? []) {
      if (visited.has(nextStationId)) continue;
      visited.add(nextStationId);
      previous.set(nextStationId, current);
      queue.push(nextStationId);
    }
  }

  if (!previous.has(targetStationId)) {
    return null;
  }

  const pathIds: string[] = [];
  for (let current: string | null = targetStationId; current; current = previous.get(current) ?? null) {
    pathIds.unshift(current);
  }

  const path = pathIds
    .map((stationId) => stationMap.get(stationId))
    .filter((station): station is Station => Boolean(station));

  return {
    target,
    path,
    hops: Math.max(path.length - 1, 0),
    isDirect: path.length === 2,
    isSameStation: path.length === 1,
  };
}

export function describeRoute(route: StationRouteResult): string {
  if (route.isSameStation) {
    return 'You are already at the managed station.';
  }

  if (route.isDirect) {
    return 'One trip. You can travel directly without changing stations.';
  }

  return `Multiple trips. This route uses ${route.hops} connected legs.`;
}
