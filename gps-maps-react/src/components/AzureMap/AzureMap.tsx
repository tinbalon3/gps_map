import React, { useEffect, useState, useRef, use } from 'react';
import { Location, RouteInfo, SearchResult } from '../../services/types';
import { RoutingService } from '../../services/routing.service';
import { SearchService } from '../../services/search.service';

// Azure Maps subscription key - should be in environment variables
const SUBSCRIPTION_KEY = '';

export const AzureMap: React.FC = () => {
  const mapRef = useRef<atlas.Map | null>(null);
  const dataSourceRef = useRef<atlas.source.DataSource | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("Vườn lài");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

 
  useEffect(() => {
    const existingScript = document.getElementById('azure-maps-sdk');
    if (existingScript) {
      setSdkLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.id = 'azure-maps-sdk';
    script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.js';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!sdkLoaded || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = new atlas.Map('azureMap', {
      authOptions: {
        authType: atlas.AuthenticationType.subscriptionKey,
        subscriptionKey: SUBSCRIPTION_KEY
      },
      center: [106.650378, 10.801300],
      zoom: 13,
      style: 'road',
      language: 'vi-VN'
    });

    mapRef.current.events.add('ready', () => {
      setIsMapReady(true);
    });
  }, [sdkLoaded]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    dataSourceRef.current = new atlas.source.DataSource();
    mapRef.current.sources.add(dataSourceRef.current);

    mapRef.current.layers.add(new atlas.layer.LineLayer(dataSourceRef.current, 'route-layer', {
      strokeColor: '#2272B9',
      strokeWidth: 5
    }));

    // Layer cho điểm ban đầu
    mapRef.current.layers.add(new atlas.layer.SymbolLayer(dataSourceRef.current, 'start-symbol', {
      filter: ['==', ['get', 'type'], 'current'],
      iconOptions: {
        anchor: 'bottom',
        allowOverlap: true,
        image: 'pin-blue'
      }
    }));

    // Layer cho điểm đến với màu đỏ
    mapRef.current.layers.add(new atlas.layer.SymbolLayer(dataSourceRef.current, 'destination-symbol', {
      filter: ['==', ['get', 'type'], 'destination'],
      iconOptions: {
        anchor: 'bottom',
        allowOverlap: true,
        image: 'pin-red'
      }
    }));

    mapRef.current.events.add('click', (e: atlas.MapMouseEvent) => {
      if (e.position) {
        const destination: Location = {
          lat: e.position[1],
          lng: e.position[0]
        };
        setDestinationLocation(destination);
      }
    });

    getCurrentLocation();
  }, [isMapReady]);
  const initialMarkerRef = useRef<atlas.Shape | null>(null);

  useEffect(() => {
    if (!isMapReady || !dataSourceRef.current) return;
    
    initialMarkerRef.current = new atlas.Shape(new atlas.data.Point([
      106.650378,
      10.801300
    ]));
    initialMarkerRef.current.addProperty('type', 'current');
    
    dataSourceRef.current.add(initialMarkerRef.current);
  }, [isMapReady]);
  useEffect(() => {
    if (isMapReady && currentLocation) {
      handleSearch();
    }
  }, [isMapReady, currentLocation]);

  const getCurrentLocation = () => {
    const location: Location = {
      lat: 10.801300,
      lng: 106.650378
    };
    setCurrentLocation(location);
    updateMap(location, destinationLocation);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isMapReady) return;

    try {
      const response = await SearchService.searchLocation({ query: searchQuery });
      if (response.status === 'success' && response.results) {
        setSearchResults(response.results);
        updateMap(currentLocation, destinationLocation);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
    }
  };

  const calculateRoute = async () => {
    if (!currentLocation || !destinationLocation || !dataSourceRef.current || !isMapReady) return;

    const end: [number, number] = [destinationLocation.lat, destinationLocation.lng];

    try {
      const response = await RoutingService.getRoute(end);
      if (response.status === 'success' && response.route) {
        setRouteInfo({
          distance: response.route.distance,
          duration: response.route.duration
        });

        const coordinates = response.route.points.map(point => [point.longitude, point.latitude]);
        const route = new atlas.Shape(new atlas.data.LineString(coordinates));

        // dataSourceRef.current.clear();
        dataSourceRef.current.add(route);
        // Thêm marker điểm đích sau khi vẽ route
        addMarkers();

        if (mapRef.current) {
          mapRef.current.setCamera({
            bounds: atlas.data.BoundingBox.fromData(route),
            padding: 50
          });
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const addMarkers = () => {
    if (!dataSourceRef.current || !isMapReady) return;

    // Thêm marker điểm đích nếu có
    if (destinationLocation) {
      const destPoint = new atlas.Shape(new atlas.data.Point([
        destinationLocation.lng,
        destinationLocation.lat
      ]));
      destPoint.addProperty('type', 'destination');
      dataSourceRef.current.add(destPoint);
    }
  };

  const updateMap = (
    current: Location | null, 
    destination: Location | null
  ) => {
    if (!mapRef.current || !dataSourceRef.current || !isMapReady) return;

    dataSourceRef.current.clear();
    if (initialMarkerRef.current) {
      dataSourceRef.current.add(initialMarkerRef.current);
    }
    
    if (current) {
      mapRef.current.setCamera({
        center: [current.lng, current.lat],
        zoom: 15,
        type: 'ease',
        duration: 1000
      });
    }

    addMarkers();
  };

  useEffect(() => {
    if (destinationLocation && isMapReady) {
      calculateRoute();
    }
  }, [destinationLocation, isMapReady]);

  return (
    <div className="azure-map-container">
      <div id="azureMap" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div className="search-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm địa điểm..."
        />
        <button onClick={handleSearch}>Tìm kiếm</button>
      </div>
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(result => (
            <div
              key={result.id}
              onClick={() => setDestinationLocation({
                lat: result.coordinates.latitude,
                lng: result.coordinates.longitude
              })}
              className="search-result-item"
            >
              <div key={`name-${result.id}`} className="result-name">{result.name}</div>
              {result.address && (
                <div key={`address-${result.id}`} className="result-address">{result.address}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {routeInfo && (
        <div className="route-info">
          <p>Khoảng cách: {(routeInfo.distance / 1000).toFixed(2)} km</p>
          <p>Thời gian: {Math.round(routeInfo.duration / 60)} phút</p>
        </div>
      )}
    </div>
  );
};
