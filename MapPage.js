import React from "react";
import AzureMapReact from "./AzureMap";

const mockAzureMapsService = {
  getSubscriptionKey: () => ""
};

const mockLocationService = {
  setDestination: (loc) => console.log("Set destination:", loc),
  updateLocation: (loc) => console.log("Update current location:", loc),
  getDestinationLocation: () => ({
    subscribe: (callback) => {
      const unsubscribe = () => {};
      return { unsubscribe };
    }
  }),
};

const mockRoutingService = {
  getRoute: (start, end) => ({
    subscribe: ({ next, error }) => {
      const mockResponse = {
        status: "success",
        route: {
          distance: 1500,
          duration: 300,
          points: [
            { longitude: start[0], latitude: start[1] },
            { longitude: end[0], latitude: end[1] }
          ]
        }
      };
      next(mockResponse);
    }
  })
};

const mockSearchService = {
  searchLocation: (request) => ({
    subscribe: ({ next, error }) => {
      const mockResponse = {
        status: "success",
        results: [
          {
            id: "1",
            name: "Vườn Lài - Hà Nội",
            address: "Số 1, Vườn Lài, Hà Nội",
            coordinates: { latitude: 21.03, longitude: 105.85 }
          }
        ]
      };
      next(mockResponse);
    }
  })
};

const MapPage = () => {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <AzureMapReact
        azureMapsService={mockAzureMapsService}
        locationService={mockLocationService}
        routingService={mockRoutingService}
        searchService={mockSearchService}
      />
    </div>
  );
};

export default MapPage;
