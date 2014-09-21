// https://github.com/ironwallaby/delaunay

interface DelaunayStatic {
  triangulate(vertices: number[][], key?: number): number[];
} // DelaunayStatic

declare var Delaunay: DelaunayStatic;
