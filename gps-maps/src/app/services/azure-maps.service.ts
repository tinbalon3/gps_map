import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import * as atlas from 'azure-maps-control';

interface AzureRouteResponse {
  routes: {
    summary: {
      lengthInMeters: number;
      travelTimeInSeconds: number;
    };
    legs: {
      points: {
        longitude: number;
        latitude: number;
      }[];
    }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AzureMapsService {
  private map: atlas.Map | null = null;
  private markers: atlas.HtmlMarker[] = [];
  private dataSource: atlas.source.DataSource | null = null;
  private isInitialized = false;

  constructor(
    @Inject('AZURE_MAPS_KEY') private azureMapsKey: string,
    private http: HttpClient
  ) {}

  getSubscriptionKey(): string {
    return this.azureMapsKey;
  }

  initMap(elementId: string): void {
    try {
      if (!document.getElementById(elementId)) {
        throw new Error(`Container '${elementId}' not found.`);
      }

      // Khởi tạo map
      this.map = new atlas.Map(elementId, {
        authOptions: {
          authType: atlas.AuthenticationType.subscriptionKey,
          subscriptionKey: this.azureMapsKey
        },
        center: [105.8542, 21.0285], // Hanoi coordinates
        zoom: 13,
        style: 'road'
      });

      // Đợi map load xong
      this.map.events.add('ready', () => {
        this.isInitialized = true;
        // Khởi tạo data source cho route
        this.dataSource = new atlas.source.DataSource();
        this.map?.sources.add(this.dataSource);

        // Thêm layer cho route
        this.map?.layers.add(new atlas.layer.LineLayer(this.dataSource, 'route-layer', {
          strokeColor: '#2272B9',
          strokeWidth: 5
        }));
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      throw error;
    }
  }

  addMarker(lat: number, lng: number, color: string = 'red'): void {
    if (!this.map || !this.isInitialized) {
      console.warn('Map not initialized');
      return;
    }

    const marker = new atlas.HtmlMarker({
      htmlContent: `<div class="map-marker" style="background-color: ${color}"></div>`,
      position: [lng, lat],
      pixelOffset: [0, -15]
    });

    this.markers.push(marker);
    this.map.markers.add(marker);
  }

  clearMarkers(): void {
    if (!this.map || !this.isInitialized) return;

    this.markers.forEach(marker => {
      this.map?.markers.remove(marker);
    });
    this.markers = [];
  }

  calculateRoute(start: [number, number], end: [number, number]): Observable<AzureRouteResponse> {
    const url = 'https://atlas.microsoft.com/route/directions/json';
    const params = {
      'subscription-key': this.azureMapsKey,
      'api-version': '1.0',
      'query': `${start[0]},${start[1]}:${end[0]},${end[1]}`,
      'routeType': 'fastest',
      'traffic': 'true'
    };

    return this.http.get<AzureRouteResponse>(url, { params }).pipe(
      map(response => {
        if (response.routes && response.routes.length > 0) {
          // Update map with route
          const points = response.routes[0].legs[0].points;
          const coordinates = points.map(point => [point.longitude, point.latitude]);

          if (this.dataSource) {
            const route = new atlas.data.LineString(coordinates);
            this.dataSource.clear();
            this.dataSource.add(new atlas.data.Feature(route));

            // Fit map view to show entire route
            if (this.map) {
              this.map.setCamera({
                bounds: atlas.data.BoundingBox.fromData(route),
                padding: 50
              });
            }
          }
        }
        return response;
      })
    );
  }

  panTo(lat: number, lng: number): void {
    if (!this.map || !this.isInitialized) return;

    this.map.setCamera({
      center: [lng, lat],
      zoom: this.map.getCamera().zoom || 13,
      type: 'ease',
      duration: 1000
    });
  }

  setCenter(lat: number, lng: number): void {
    if (!this.map || !this.isInitialized) return;

    this.map.setCamera({
      center: [lng, lat]
    });
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}