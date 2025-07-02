# IP Restriction Configuration

Hệ thống hỗ trợ giới hạn IP để chỉ cho phép chấm công từ các địa chỉ IP/mạng được phép.

## Cấu hình Environment Variables

Thêm vào file `.env`:

```bash
# Bật/tắt tính năng giới hạn IP
ENABLE_IP_RESTRICTION=false

# Môi trường development (ít hạn chế hơn)
NODE_ENV=development
```

## Cấu hình trong file `src/config/ipConfig.js`

### 1. Bật/tắt tính năng
```javascript
ENABLE_IP_RESTRICTION: true  // Bật giới hạn IP
```

### 2. Danh sách IP được phép
```javascript
ALLOWED_IPS: [
  '127.0.0.1',           // Localhost
  '192.168.1.100',       // IP cố định cụ thể
  '10.0.0.50',           // IP văn phòng
]
```

### 3. Danh sách subnet được phép (CIDR)
```javascript
ALLOWED_SUBNETS: [
  '192.168.1.0/24',      // Mạng văn phòng cụ thể
  '10.0.0.0/8',          // Toàn bộ mạng private class A
  '172.16.0.0/12',       // Toàn bộ mạng private class B
]
```

## Các trường hợp được phép

### Development Mode (NODE_ENV=development)
- Localhost (127.0.0.1, ::1)
- Tất cả IP private (10.x.x.x, 172.16-31.x.x, 192.168.x.x)

### Production Mode
- IP trong danh sách ALLOWED_IPS
- IP trong subnet ALLOWED_SUBNETS
- IP cùng subnet với server
- Localhost (luôn được phép)

## Logging

```javascript
LOG_IP_ATTEMPTS: true,    // Log tất cả attempts
LOG_ALLOWED_IPS: false,   // Log IP được phép
LOG_BLOCKED_IPS: true,    // Log IP bị chặn
```

## Thông báo lỗi tùy chỉnh

```javascript
MESSAGES: {
  IP_NOT_ALLOWED: 'Không thể chấm công từ vị trí này',
  IP_RESTRICTION_DETAILS: 'Bạn chỉ có thể chấm công khi kết nối từ mạng công ty',
  IP_BLOCKED: 'Địa chỉ IP của bạn không được phép thực hiện thao tác này'
}
```

## Ví dụ cấu hình thực tế

### Văn phòng nhỏ (1 mạng)
```javascript
ENABLE_IP_RESTRICTION: true,
ALLOWED_SUBNETS: [
  '192.168.1.0/24',  // Mạng văn phòng
],
```

### Công ty lớn (nhiều chi nhánh)
```javascript
ENABLE_IP_RESTRICTION: true,
ALLOWED_IPS: [
  '203.162.4.100',   // IP public chi nhánh 1
  '115.78.45.200',   // IP public chi nhánh 2
],
ALLOWED_SUBNETS: [
  '192.168.1.0/24',  // Mạng nội bộ chi nhánh 1
  '192.168.2.0/24',  // Mạng nội bộ chi nhánh 2
  '10.0.0.0/16',     // VPN network
],
```

### Development/Testing
```javascript
ENABLE_IP_RESTRICTION: false,  // Tắt hẳn
```

## Debug

Xem log server để kiểm tra IP:
```bash
[2024-01-01T10:00:00Z] IP BLOCKED: 192.168.2.100 - IP not in allowed range
[2024-01-01T10:01:00Z] IP ALLOWED: 192.168.1.50 - IP in allowed subnet: 192.168.1.0/24
``` 