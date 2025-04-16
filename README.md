# Azure Maps Routing API

Backend API service cho việc tích hợp với Azure Maps để tính toán tuyến đường.

## Cài đặt

1. Tạo môi trường ảo Python:
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

2. Cài đặt các dependencies:
```bash
pip install -r requirements.txt
```

3. Cấu hình môi trường:
- Sao chép file `.env.example` thành `.env`
- Cập nhật các giá trị trong `.env` với Azure Maps credentials của bạn

## Chạy server

```bash
uvicorn main:app --reload
```

Server sẽ chạy tại http://localhost:8000

## API Endpoints

### GET /
- Kiểm tra API đang hoạt động
- Response: `{"status": "Azure Maps Routing API is running"}`

### POST /route
Tính toán tuyến đường giữa hai điểm

Request body:
```json
{
  "destination_location": {   // Required - điểm kết thúc
    "latitude": 21.0355,
    "longitude": 105.8460
  },
  "avoid": ["tollRoads", "ferries"]  // Optional - tránh đường thu phí, phà
}
```
Request body:
```json
{
  "destination_location": {
    "latitude": 21.0355,
    "longitude": 105.8460
  },
  "avoid": ["tollRoads", "ferries"]  // Optional
}
```

Response:
```json
{
  "status": "success",
  "route": {
    "distance": 1234.56,        // meters
    "duration": 300,            // seconds
    "points": [                 // Chi tiết các điểm trên tuyến đường
      {
        "latitude": 21.0285,
        "longitude": 105.8542,
      },
      // ...
    ],
    "waypoints": [             // Các điểm dừng/rẽ chính
      {
        "latitude": 21.0295,
        "longitude": 105.8532,
      },
      // ...
    ]
  }
}
```

### GET /search
Tìm kiếm địa điểm theo từ khóa

Request body:
```json
{
  "query": "Hồ Gươm"  // Required - từ khóa tìm kiếm
}
```

Response:
```json
{
  "status": "success",
  "results": [
    {
      "name": "Hồ Hoàn Kiếm",
      "address": "Phố Lê Thái Tổ, Hàng Trống, Hoàn Kiếm, Hà Nội",
      "coordinates": {
        "latitude": 21.0287,
        "longitude": 105.8524
      }
    }
    // ... có thể có nhiều kết quả khác
  ]
}
```

### GET /health
Kiểm tra trạng thái hoạt động của service

Response:
```json
{
  "status": "healthy",
  "azure_maps": "connected"
}
```

## Lỗi và Xử lý lỗi

API trả về lỗi với format:
```json
{
  "status": "error",
  "error": "Mô tả lỗi"
}
```

Các mã lỗi HTTP:
- 400: Bad Request - Dữ liệu không hợp lệ
- 401: Unauthorized - Azure Maps credentials không hợp lệ
- 503: Service Unavailable - Không thể kết nối đến Azure Maps
- 500: Internal Server Error - Lỗi server khác

## Bảo mật
- API sử dụng Azure Maps authentication
- CORS được cấu hình cho Angular frontend (http://localhost:4200)
- Các credentials nhạy cảm được lưu trong file .env