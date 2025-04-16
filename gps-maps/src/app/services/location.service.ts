import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Location {
  lat: number;  // Vĩ độ
  lng: number;  // Kinh độ
}

export interface RoutePoints {
  start: [number, number];
  end: [number, number];
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private currentLocation = new BehaviorSubject<Location | null>(null);
  private destinationLocation = new BehaviorSubject<Location | null>(null);
  private routePoints = new BehaviorSubject<RoutePoints | null>(null);

  // Observable streams
  currentLocation$ = this.currentLocation.asObservable();
  destination$ = this.destinationLocation.asObservable();
  routePoints$ = this.routePoints.asObservable();

  constructor() {}

  /**
   * Cập nhật vị trí hiện tại
   */
  updateLocation(location: Location): void {
    this.currentLocation.next(location);
  }

  /**
   * Lấy Observable của vị trí hiện tại
   */
  getCurrentLocation(): Observable<Location | null> {
    return this.currentLocation$;
  }

  /**
   * Đặt điểm đến mới
   */
  setDestination(location: Location): void {
    this.destinationLocation.next(location);
    
    const currentValue = this.currentLocation.getValue();
    if (currentValue) {
      this.setRoutePoints(
        [currentValue.lat, currentValue.lng],
        [location.lat, location.lng]
      );
    }
  }

  /**
   * Lấy Observable của điểm đến
   */
  getDestinationLocation(): Observable<Location | null> {
    return this.destinationLocation.asObservable();
  }

  /**
   * Cập nhật điểm bắt đầu và kết thúc của tuyến đường
   */
  setRoutePoints(start: [number, number], end: [number, number]): void {
    this.routePoints.next({ start, end });
  }
}
