from pydantic import BaseModel, Field
from typing import List, Optional

class Coordinates(BaseModel):
    latitude: float
    longitude: float

class SearchRequest(BaseModel):
    query: Optional[str] = None
  
    
class SearchResult(BaseModel):
    name: str
    address: Optional[str] = None
    coordinates: Coordinates
    
class RouteRequest(BaseModel):
    destination_location:  Optional[Coordinates] = None
    avoid: Optional[List[str]] = [] # Các loại đường cần tránh: ['tollRoads', 'ferries', etc.]
    
class SearchResponse(BaseModel):
    status: str
    results: Optional[List[SearchResult]] = None
    error: Optional[str] = None
    
class RoutePoint(BaseModel):
    latitude: float
    longitude: float
  

class RouteDetails(BaseModel):
    distance: float # Tổng khoảng cách (mét)
    duration: float # Thời gian dự kiến (giây)
    points: List[RoutePoint] # Các điểm trên tuyến đường
    waypoints: List[RoutePoint] # Các điểm dừng/rẽ chính

class RouteResponse(BaseModel):
    status: str
    route: Optional[RouteDetails] = None
    error: Optional[str] = None

class ErrorResponse(BaseModel):
    status: str = "error"
    error: str