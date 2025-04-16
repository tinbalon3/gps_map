from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import requests
from schemas import (
    RouteRequest, RouteResponse, ErrorResponse, SearchRequest, SearchResponse
)
from azure_maps import azure_maps_service
from config import settings

app = FastAPI(title="Azure Maps Routing API")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "Azure Maps Routing API is running"}

@app.post("/route", response_model=RouteResponse)
async def get_route(request: RouteRequest):
    """
    Lấy thông tin tuyến đường từ điểm xuất phát đến điểm đến
    """
    try:
       
        start_coords = (10.801300,106.650378)
        if request.destination_location.latitude != 0 and request.destination_location.longitude != 0:
            end_coords = (request.destination_location.latitude, request.destination_location.longitude)
        else:
            end_coords = (10.847037, 106.692735)
       
            
        route = await azure_maps_service.get_route(
            start_coords=start_coords,
            end_coords=end_coords,
            avoid=request.avoid
        )
        
        return RouteResponse(
            status="success",
            route=route
        )
        
    except HTTPException as e:
        return RouteResponse(
            status="error",
            error=str(e.detail)
        )
    except Exception as e:
        return RouteResponse(
            status="error",
            error="Internal server error"
        )
@app.post("/search", response_model=SearchResponse)
async def search_places(request: SearchRequest):
    """
    Tìm kiếm địa điểm gần vị trí người dùng, truyền vào vị trí muốn tìm và vị trí hiện tại của người dùng  (lat/lon).
    """
    try:
        start_coords = (10.801300,106.650378)
        if request.query == None:
            query = "Vườn lài"
        else:
            query = request.query
        
        radius =  10000  # Default radius is 10km
        
        results = await azure_maps_service.search_places(
            query=query,
            latitude=start_coords[0],
            longitude=start_coords[1],
            radius=radius
        )
        return SearchResponse(
            status="success",
            results=results
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Azure Maps error: {str(e)}")
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid response from Azure Maps")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid coordinates")
   

# Thêm error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return ErrorResponse(error=str(exc.detail))

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return ErrorResponse(error="Internal server error")