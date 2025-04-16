import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AzureMapsService } from '../../services/azure-maps.service';
import { LocationService, Location } from '../../services/location.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import * as atlas from 'azure-maps-control';
import { RoutingService, RouteResponse } from '../../services/routing.service';
import { SearchResponse, SearchResult, SearchService } from '../../services/search.service';


interface RouteInfo {
  distance: number;  // meters
  duration: number;  // seconds
}

@Component({
  selector: 'app-azure-map',
  templateUrl: './azure-map.component.html',
  styleUrls: ['./azure-map.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AzureMapComponent implements OnInit, OnDestroy {
  private map: atlas.Map | null = null;
  private dataSource: atlas.source.DataSource | null = null;
  private checkReadyInterval: any;
  private subscriptions: Subscription[] = [];
  private userLocationWatchId: number | null = null;

  // Make these public for template access
  currentLocation: Location | null = null;
  destinationLocation: Location | null = null;
  routeInfo: RouteInfo | null = null;
  searchQuery: string = '';
  searchResults: SearchResult[] = [];

  constructor(
    private azureMapsService: AzureMapsService,
    private locationService: LocationService,
    private routingService: RoutingService,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.loadAzureMapsSDK();
   
  }

  private loadAzureMapsSDK() {
    // Load Azure Maps API
    const script = document.createElement('script');
    script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Load Azure Maps CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.css';
    document.head.appendChild(link);

    // Initialize map after SDK loads
    script.onload = () => {
      this.initializeMap();
    };
  }

  private initializeMap() {
    this.map = new atlas.Map('azureMap', {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: this.azureMapsService.getSubscriptionKey()
      },
      center: [105.8542, 21.0285],
      zoom: 13,
      style: 'road',
      language: 'vi-VN'
    });

    this.map.events.add('ready', () => {
      // Thêm sprites cho markers
      this.map?.imageSprite.add('marker-red', '/assets/marker-icon-red.png');
      this.map?.imageSprite.add('marker-blue', '/assets/marker-icon.png');

      // Khởi tạo data source cho routing
      this.dataSource = new atlas.source.DataSource();
      this.map?.sources.add(this.dataSource);

      // Thêm layer cho route
      this.map?.layers.add(new atlas.layer.LineLayer(this.dataSource, 'route-layer', {
        strokeColor: '#2272B9',
        strokeWidth: 5
      }));
      
      
    
      this.getCurrentLocation();

      // Subscribe to destination updates
      this.subscribeToLocationUpdates();

      // Thêm click event để đặt điểm đến
      this.map?.events.add('click', (e: atlas.MapMouseEvent) => {
        if (e.position) {
          const destination: Location = {
            lat: e.position[1],
            lng: e.position[0]
          };
          this.locationService.setDestination(destination);
        }
      });
       // Click vào marker kết quả tìm kiếm
    this.map?.events.add('click', (e: atlas.MapMouseEvent) => {
      const position = e.position;
      if (position) {
       
        const destination: Location = {
          lat: position[1],
          lng: position[0]
        };
        this.locationService.setDestination(destination);
      }
    });
    });
    this.searchQuery = "Vườn lài"
    console.log(this.searchQuery)
    this.onSearch()
  }
  selectSearchResult(result: SearchResult): void {
    const destination: Location = {
      lat: result.coordinates.latitude,
      lng: result.coordinates.longitude
    };
    this.locationService.setDestination(destination);
  }
  
  private getCurrentLocation() {
    if (!navigator.geolocation) {
      console.error('Geolocation không được hỗ trợ');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.currentLocation = location;
        this.updateCurrentPosition(location);
        this.locationService.updateLocation(location);

        // Start watching position after getting initial location
        this.startWatchingPosition();
      },
      (error) => {
        console.error('Lỗi khi lấy vị trí:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  private startWatchingPosition() {
    this.userLocationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.currentLocation = location;
        this.updateCurrentPosition(location);
        this.locationService.updateLocation(location);
      },
      (error) => {
        console.error('Lỗi khi theo dõi vị trí:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  private subscribeToLocationUpdates() {
    // Subscribe to destination updates
    this.subscriptions.push(
      this.locationService.getDestinationLocation().subscribe(destination => {
        if (destination) {
          this.destinationLocation = destination;
          this.updateMap();
        }
      })
    );
  }

  private updateMap() {
    if (!this.map || !this.dataSource) return;

    // Clear existing data
    this.dataSource.clear();

    // Add current location marker
    if (this.currentLocation) {
      const currentPoint = new atlas.Shape(new atlas.data.Point([
        this.currentLocation.lng,
        this.currentLocation.lat
      ]));
      currentPoint.addProperty('type', 'current');
      this.dataSource.add(currentPoint);

      // Add accuracy circle around current location using a polygon
      const center = [this.currentLocation.lng, this.currentLocation.lat];
      const radius = 100; // meters
      const points = this.createCirclePoints(center, radius);
      const accuracyCircle = new atlas.Shape(new atlas.data.Polygon([points]));
      accuracyCircle.addProperty('type', 'accuracy');
      this.dataSource.add(accuracyCircle);
    }

    // Add destination marker
    if (this.destinationLocation) {
      const destPoint = new atlas.Shape(new atlas.data.Point([
        this.destinationLocation.lng,
        this.destinationLocation.lat
      ]));
      destPoint.addProperty('type', 'destination');
      this.dataSource.add(destPoint);

      // Calculate route if both points exist
      if (this.currentLocation) {
        this.calculateRoute();
      }
    }
// Add search result markers
for (const result of this.searchResults) {
  const marker = new atlas.Shape(new atlas.data.Point([
    result.coordinates.longitude,
    result.coordinates.latitude
  ]));
  marker.addProperty('type', 'search');
  marker.addProperty('id', result.id); // dùng để phân biệt nếu cần
  this.dataSource.add(marker);
}

    // Add layers if not already added
    if (!this.map.layers.getLayerById('symbols')) {
      // Add a symbol layer for the points
      this.map.layers.add(new atlas.layer.SymbolLayer(this.dataSource, 'symbols', {
        iconOptions: {
          image: [
            'case',
            ['==', ['get', 'type'], 'current'],
            'marker-red',
            'marker-blue'
          ],
          anchor: 'bottom',
          size: 1
        },
        filter: ['any', ['==', ['get', 'type'], 'current'], ['==', ['get', 'type'], 'destination']]
      }));

      // Add a fill layer for the accuracy circle
      this.map.layers.add(new atlas.layer.PolygonLayer(this.dataSource, 'accuracy-fill', {
        filter: ['==', ['get', 'type'], 'accuracy'],
        fillColor: 'rgba(0, 102, 255, 0.1)',
      }));

      // Add an outline layer for the accuracy circle
      this.map.layers.add(new atlas.layer.LineLayer(this.dataSource, 'accuracy-outline', {
        filter: ['==', ['get', 'type'], 'accuracy'],
        strokeColor: 'white',
        strokeWidth: 2
      }));
    }
  }

  private createCirclePoints(center: number[], radius: number): number[][] {
    const points: number[][] = [];
    const steps = 64;
    const circumference = 2 * Math.PI;
    const radiusInDegrees = radius / 111000; // approximate degrees per meter at the equator

    for (let i = 0; i <= steps; i++) {
      const angle = (circumference * i) / steps;
      const dx = radiusInDegrees * Math.cos(angle);
      const dy = radiusInDegrees * Math.sin(angle);
      points.push([center[0] + dx, center[1] + dy]);
    }
    return points;
  }

  private calculateRoute() {
    if (!this.currentLocation || !this.destinationLocation || !this.dataSource) return;

    const start: [number, number] = [this.currentLocation.lat, this.currentLocation.lng];
    const end: [number, number] = [this.destinationLocation.lat, this.destinationLocation.lng];

    this.routingService.getRoute(start, end).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.route) {
          // Cập nhật route info
          this.routeInfo = {
            distance: response.route.distance,
            duration: response.route.duration
          };

          // Vẽ tuyến đường
          const coordinates = response.route.points.map(point => [point.longitude, point.latitude]);
          const route = new atlas.data.LineString(coordinates);
          
          // Clear và thêm route mới
          this.dataSource?.clear();
          
          // Thêm lại các markers
          if (this.currentLocation) {
            const currentPoint = new atlas.Shape(new atlas.data.Point([
              this.currentLocation.lng,
              this.currentLocation.lat
            ]));
            currentPoint.addProperty('type', 'current');
            this.dataSource?.add(currentPoint);
          }

          if (this.destinationLocation) {
            const destPoint = new atlas.Shape(new atlas.data.Point([
              this.destinationLocation.lng,
              this.destinationLocation.lat
            ]));
            destPoint.addProperty('type', 'destination');
            this.dataSource?.add(destPoint);
          }

          // Thêm route
          this.dataSource?.add(new atlas.data.Feature(route));

          // Điều chỉnh camera để hiển thị toàn bộ route
          if (this.map) {
            this.map.setCamera({
              bounds: atlas.data.BoundingBox.fromData(route),
              padding: 50
            });
          }
        }
      },
      error: (error) => {
        console.error('Error calculating route:', error);
      }
    });
  }

  private updateCurrentPosition(location: Location): void {
    if (!this.map) return;

    this.map.setCamera({
      center: [location.lng, location.lat],
      zoom: 15,
      type: 'ease',
      duration: 1000
    });

    this.updateMap();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.checkReadyInterval) {
      clearInterval(this.checkReadyInterval);
    }

    if (this.userLocationWatchId !== null) {
      navigator.geolocation.clearWatch(this.userLocationWatchId);
    }

    if (this.map) {
      this.map.dispose();
    }
  }

  onSearch(): void {
    
    if (!this.searchQuery.trim()) return;
    var request = {}
    if (!this.currentLocation) {
       request = {
        query: this.searchQuery,
        
      };
    }
    else {
       request = {
        query: this.searchQuery,
       
      };
    }
   
 
    this.searchService.searchLocation(request).subscribe({
      next: (response: SearchResponse) => {
        if (response.status === 'success' && response.results) {
          this.searchResults = response.results;
          console.log('Kết quả tìm kiếm:', this.searchResults);
        } else {
          console.error('Lỗi tìm kiếm:', response.error);
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi tìm kiếm:', error);
      }
    });
    this.updateMap(); // cập nhật bản đồ sau khi có kết quả mới

  }
}
