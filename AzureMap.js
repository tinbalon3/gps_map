// AzureMapReact.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as atlas from 'azure-maps-control';
import emojiVIE from "../assets/Vietnamese.png";
import emojiENG from "../assets/English.png";

const AzureMapReact = ({ azureMapsService, locationService, routingService, searchService }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const dataSourceRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('Vườn lài');
  const [searchResults, setSearchResults] = useState([]);
  const destinationSubRef = useRef(null);

  const getRandomCoordinate = () => {
    const baseLat = 21.0285;
    const baseLng = 105.8542;
    const randomOffset = () => (Math.random() - 0.5) * 0.1;
    return {
      lat: baseLat + randomOffset(),
      lng: baseLng + randomOffset(),
    };
  };

  useEffect(() => {
    const loadAzureMap = () => {
      const container = mapRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver(() => {
        if (mapInstance.current) {
          mapInstance.current.resize();
        }
      });
      resizeObserver.observe(container);

      mapInstance.current = new atlas.Map(container, {
        authOptions: {
          authType: atlas.AuthenticationType.subscriptionKey,
          subscriptionKey: azureMapsService.getSubscriptionKey(),
        },
        center: [105.8542, 21.0285],
        zoom: 13,
        style: 'road',
        language: 'vi-VN',
      });

      mapInstance.current.events.add('ready', () => {
        mapInstance.current.imageSprite.add('marker-red', emojiVIE);
        mapInstance.current.imageSprite.add('marker-blue', emojiVIE);

        dataSourceRef.current = new atlas.source.DataSource();
        mapInstance.current.sources.add(dataSourceRef.current);

        mapInstance.current.layers.add(new atlas.layer.LineLayer(dataSourceRef.current, 'route-layer', {
          strokeColor: '#2272B9',
          strokeWidth: 5,
        }));

        const randomStart = getRandomCoordinate();
        const randomEnd = getRandomCoordinate();
        setCurrentLocation(randomStart);
        locationService.updateLocation(randomStart);
        setDestinationLocation(randomEnd);
        locationService.setDestination(randomEnd);

        mapInstance.current.events.add('click', (e) => {
          if (e.position) {
            const destination = { lat: e.position[1], lng: e.position[0] };
            locationService.setDestination(destination);
          }
        });

        destinationSubRef.current = locationService.getDestinationLocation().subscribe((destination) => {
          if (destination) {
            setDestinationLocation(destination);
          }
        });

        onSearch();
      });

      return () => {
        resizeObserver.disconnect();
      };
    };

    const cleanup = loadAzureMap();
    return () => {
      if (mapInstance.current) {
        mapInstance.current.dispose();
      }
      if (destinationSubRef.current) {
        destinationSubRef.current.unsubscribe();
      }
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    updateMap();
  }, [currentLocation, destinationLocation, searchResults]);

  const updateMap = () => {
    if (!mapInstance.current || !dataSourceRef.current) return;
    const ds = dataSourceRef.current;
    ds.clear();

    if (currentLocation) {
      const currentShape = new atlas.Shape(new atlas.data.Point([currentLocation.lng, currentLocation.lat]));
      currentShape.addProperty('type', 'current');
      ds.add(currentShape);
    }

    if (destinationLocation) {
      const destShape = new atlas.Shape(new atlas.data.Point([destinationLocation.lng, destinationLocation.lat]));
      destShape.addProperty('type', 'destination');
      ds.add(destShape);
      calculateRoute();
    }

    searchResults.forEach((res) => {
      const marker = new atlas.Shape(new atlas.data.Point([res.coordinates.longitude, res.coordinates.latitude]));
      marker.addProperty('type', 'search');
      marker.addProperty('id', res.id);
      ds.add(marker);
    });
  };

  const calculateRoute = () => {
    if (!currentLocation || !destinationLocation || !dataSourceRef.current) return;
    const start = [currentLocation.lng, currentLocation.lat];
    const end = [destinationLocation.lng, destinationLocation.lat];

    routingService.getRoute(start, end).subscribe({
      next: (res) => {
        if (res.status === 'success' && res.route) {
          setRouteInfo({ distance: res.route.distance, duration: res.route.duration });
          const coords = res.route.points.map((p) => [p.longitude, p.latitude]);
          const route = new atlas.data.LineString(coords);
          dataSourceRef.current.add(new atlas.Shape(route));

          setTimeout(() => {
            mapInstance.current.setCamera({
              bounds: atlas.data.BoundingBox.fromData(route),
              padding: 50,
            });
          }, 0);
        }
      },
      error: (err) => console.error('Error calculating route:', err),
    });
  };

  const onSearch = () => {
    if (!searchQuery.trim()) return;
    const request = { query: searchQuery };

    searchService.searchLocation(request).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          setSearchResults(res.results);
        }
      },
      error: (err) => console.error('Search error:', err),
    });
  };

  const selectSearchResult = (res) => {
    const destination = {
      lat: res.coordinates.latitude,
      lng: res.coordinates.longitude,
    };
    locationService.setDestination(destination);
  };

  return (
    <div className="map-container">
      <div className="search-box">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm địa điểm..."
        />
        <button onClick={onSearch}>Tìm kiếm</button>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <ul>
            {searchResults.map((r) => (
              <li key={r.id} onClick={() => selectSearchResult(r)}>
                <strong>{r.name}</strong><br />
                <small>{r.address}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div id="azureMap" ref={mapRef} style={{ width: '100%', height: '100vh' }}></div>

      {(currentLocation || destinationLocation) && (
        <div className="info-panel">
          {currentLocation && (
            <div className="location-info">
              <h4>Vị trí hiện tại</h4>
              <p>Vĩ độ: {currentLocation.lat.toFixed(6)}</p>
              <p>Kinh độ: {currentLocation.lng.toFixed(6)}</p>
            </div>
          )}
          {destinationLocation && (
            <div className="location-info">
              <h4>Điểm đến</h4>
              <p>Vĩ độ: {destinationLocation.lat.toFixed(6)}</p>
              <p>Kinh độ: {destinationLocation.lng.toFixed(6)}</p>
            </div>
          )}
          {routeInfo && (
            <div className="route-info">
              <h4>Thông tin tuyến đường</h4>
              <p>Khoảng cách: {(routeInfo.distance / 1000).toFixed(1)} km</p>
              <p>Thời gian: {(routeInfo.duration / 60).toFixed(0)} phút</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AzureMapReact;