export interface Location {
  lat: number;
  lng: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  instruction?: string;
  distance_from_start?: number;
}

export interface RouteDetails {
  distance: number;
  duration: number;
  points: RoutePoint[];
  waypoints: RoutePoint[];
}

export interface RouteResponse {
  status: string;
  route?: RouteDetails;
  error?: string;
}

export interface RouteRequest {
  destination_location: Coordinates;
  avoid?: string[];
}

export interface SearchResult {
  id: string;
  name: string;
  coordinates: Coordinates;
  address?: string;
}

export interface SearchResponse {
  status: string;
  results?: SearchResult[];
  error?: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
}