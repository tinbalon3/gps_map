# Backend API Documentation

## 1. API Tìm Kiếm Địa Điểm (Search API)

API này cho phép tìm kiếm các địa điểm dựa trên từ khóa tìm kiếm và vị trí của người dùng.

### Thông tin Endpoint

- **URL**: `/search`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Tham số đầu vào

```json
{
  "query": "từ khóa tìm kiếm (ví dụ: Vườn lài)",
  "coordinates": {
    "latitude": 10.801300,
    "longitude": 106.650378
  }
}
```

- `query`: Từ khóa tìm kiếm (không bắt buộc, mặc định là "Vườn lài")
- `coordinates`: Vị trí hiện tại của người dùng (không bắt buộc)
  - `latitude`: Vĩ độ
  - `longitude`: Kinh độ

### Dữ liệu trả về

```json
{
  "status": "success",
  "results": [
    {
      "name": "Tên địa điểm",
      "address": "Địa chỉ chi tiết",
      "coordinates": {
        "latitude": 10.801300,
        "longitude": 106.650378
      }
    }
  ],
  "error": "Thông báo lỗi (nếu có)"
}
```

### Thông số kỹ thuật

- Bán kính tìm kiếm: 10km xung quanh vị trí người dùng
- Nếu không cung cấp vị trí, hệ thống sẽ sử dụng tọa độ mặc định (10.801300, 106.650378)
- API tích hợp với Azure Maps để cung cấp dữ liệu chính xác

### Xử lý lỗi

- **400**: Invalid coordinates - Tọa độ không hợp lệ
- **400**: Invalid response from Azure Maps - Lỗi từ Azure Maps API
- **500**: Azure Maps error - Lỗi kết nối với Azure Maps
- **500**: Internal server error - Lỗi hệ thống

### Ví dụ sử dụng

```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Vườn lài",
    "coordinates": {
      "latitude": 10.801300,
      "longitude": 106.650378
    }
  }'
```

## 2. API Tìm Đường (Route API)

API này cho phép tìm tuyến đường từ điểm xuất phát đến điểm đích, với khả năng tránh các loại đường không mong muốn.

### Thông tin Endpoint

- **URL**: `/route`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Tham số đầu vào

```json
{
  "start": {
    "latitude": 10.801300,
    "longitude": 106.650378
  },
  "end": {
    "latitude": 10.847037,
    "longitude": 106.692735
  },
  "avoid": ["tollRoads", "ferries"]
}
```

- `start`: Tọa độ điểm xuất phát (không bắt buộc, có giá trị mặc định)
  - `latitude`: Vĩ độ
  - `longitude`: Kinh độ
- `end`: Tọa độ điểm đích (không bắt buộc, có giá trị mặc định)
  - `latitude`: Vĩ độ
  - `longitude`: Kinh độ
- `avoid`: Danh sách các loại đường cần tránh (không bắt buộc)
  - Các giá trị có thể: "tollRoads" (đường thu phí), "ferries" (phà)

### Dữ liệu trả về

```json
{
  "status": "success",
  "route": {
    "distance": 8500.5,
    "duration": 1200,
    "points": [
      {
        "latitude": 10.801300,
        "longitude": 106.650378,
        "distance_from_start": 0
      }
    ],
    "waypoints": [
      {
        "latitude": 10.801300,
        "longitude": 106.650378,
        "distance_from_start": 0
      }
    ]
  },
  "error": "Thông báo lỗi (nếu có)"
}
```

- `distance`: Tổng khoảng cách (mét)
- `duration`: Thời gian dự kiến (giây)
- `points`: Danh sách các điểm trên tuyến đường
- `waypoints`: Danh sách các điểm dừng/rẽ chính

### Xử lý lỗi

- **400**: Invalid coordinates - Tọa độ không hợp lệ
- **500**: Azure Maps error - Lỗi kết nối với Azure Maps
- **500**: Internal server error - Lỗi hệ thống

### Ví dụ sử dụng

```bash
curl -X POST http://localhost:8000/route \
  -H "Content-Type: application/json" \
  -d '{
    "start": {
      "latitude": 10.801300,
      "longitude": 106.650378
    },
    "end": {
      "latitude": 10.847037,
      "longitude": 106.692735
    },
    "avoid": ["tollRoads"]
  }'
```

## 3. API Kiểm Tra Trạng Thái (Health Check)

### Thông tin Endpoint

- **URL**: `/`
- **Method**: `GET`

### Dữ liệu trả về

```json
{
  "status": "Azure Maps Routing API is running"
}
```

API này dùng để kiểm tra trạng thái hoạt động của hệ thống.