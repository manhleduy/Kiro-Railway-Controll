/**
 * Directed Graph class with BFS shortest path search
 */
export class Graph {
    private adjacencyList: Map<string, string[]>;

    constructor() {
        this.adjacencyList = new Map();
    }

    // Add a vertex if it doesn't exist
    addVertex(vertex: string): void {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, []);
        }
    }

    // Add a directed edge from src to dest
    addEdge(src: string, dest: string): void {
        if (!this.adjacencyList.has(src)) this.addVertex(src);
        if (!this.adjacencyList.has(dest)) this.addVertex(dest);
        this.adjacencyList.get(src)!.push(dest);
    }

    /**
     * BFS to check if start can reach end and return shortest path
     */
    shortestPath(start: string, end: string): { reachable: boolean; path: string[] } {
        if (!this.adjacencyList.has(start) || !this.adjacencyList.has(end)) {
            return { reachable: false, path: [] };
        }

        const queue: string[] = [start];
        const visited: Set<string> = new Set([start]);
        const parent: Map<string, string | null> = new Map();
        parent.set(start, null);

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current === end) {
                // Reconstruct path
                const path: string[] = [];
                let node: string | null = end;
                while (node !== null) {
                    path.unshift(node);
                    node = parent.get(node) || null;
                }
                return { reachable: true, path };
            }

            for (const neighbor of this.adjacencyList.get(current)!) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    parent.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }

        return { reachable: false, path: [] };
    }
}

