import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteRequest {
 
  destination_location: Coordinates;
  avoid?: string[];
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

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getRoute( end: [number, number]): Observable<RouteResponse> {
    const request: RouteRequest = {
      
      destination_location: {
        latitude: end[0],
        longitude: end[1]
      }
    };

    return this.http.post<RouteResponse>(`${this.apiUrl}/route`, request);
  }

 
}