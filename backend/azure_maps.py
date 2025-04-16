import requests
from typing import Dict, Any, List, Tuple
from fastapi import HTTPException
from config import settings
from schemas import Coordinates, RouteDetails, RoutePoint, SearchResult

class AzureMapsService:
    def __init__(self):
        self.base_url = settings.AZURE_MAPS_BASE_URL
        self.subscription_key = settings.AZURE_MAPS_KEY
        self.session = requests.Session()
        self.session.params = {'subscription-key': self.subscription_key}

    async def get_route(self, start_coords: Tuple[float, float], 
                       end_coords: Tuple[float, float], 
                       avoid: List[str] = None) -> RouteDetails:
        """
        Lấy thông tin tuyến đường từ Azure Maps API
        """
        url = f"{self.base_url}/route/directions/json"
        
        # Chuẩn bị params cho request
        params = {
            'api-version': '1.0',
            'query': f'{start_coords[0]},{start_coords[1]}:{end_coords[0]},{end_coords[1]}',
            'routeType': 'fastest',
            'traffic': 'true',
            'instructionsType': 'text',
            'language': 'vi-VN',
            'computeTravelTimeFor': 'all'
        }

        if avoid:
            params['avoid'] = ','.join(avoid)

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if 'error' in data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Azure Maps API error: {data['error']['message']}"
                )

            return self._parse_route_response(data)

        except requests.RequestException as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get route from Azure Maps: {str(e)}"
            )

    def _parse_route_response(self, data: Dict[str, Any]) -> RouteDetails:
        """
        Chuyển đổi response từ Azure Maps sang RouteDetails
        """
        if not data.get('routes') or not data['routes'][0]:
            raise HTTPException(
                status_code=400,
                detail="No route found"
            )

        route = data['routes'][0]
        legs = route.get('legs', [{}])[0]
        points = legs.get('points', [])
        guidance = legs.get('guidance', {})
        maneuvers = guidance.get('instructions', [])

        # Tạo danh sách các điểm trên tuyến đường
        route_points = []
        for idx, point in enumerate(points):
           
            route_points.append(RoutePoint(
                latitude=point['latitude'],
                longitude=point['longitude'],
               
                distance_from_start=point.get('distanceFromStart', 0)
            ))

        # Tạo danh sách các điểm dừng/rẽ chính
        waypoints = []
        for maneuver in maneuvers:
            waypoints.append(RoutePoint(
                latitude=maneuver['point']['latitude'],
                longitude=maneuver['point']['longitude'],
                instruction=maneuver.get('text', ''),
                distance_from_start=maneuver.get('distanceFromStart', 0)
            ))

        return RouteDetails(
            distance=route.get('summary', {}).get('lengthInMeters', 0),
            duration=route.get('summary', {}).get('travelTimeInSeconds', 0),
            points=route_points,
            waypoints=waypoints
        )
    async def search_places(self, query: str, latitude: float, longitude: float, radius: int = 10000) -> List[SearchResult]:
        url = f"{self.base_url}/search/poi/json"
        params = {
            'api-version': '1.0',
            'query': query,
            'lat': latitude,
            'lon': longitude,
            'radius': radius,
            'language': 'vi-VN'
        }

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("results", []):
              
                coords = Coordinates(
                    latitude=item["position"]["lat"],
                    longitude=item["position"]["lon"]
                )
                place = SearchResult(
                    name=item["poi"].get("name", "(không rõ)"),
                    address=item["address"].get("freeformAddress", "(không rõ)"),
                    coordinates=coords
                )
                results.append(place)

            return results

        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Azure Maps error: {str(e)}")
# Tạo singleton instance
azure_maps_service = AzureMapsService()