// Cấu hình ngày làm việc của công ty
// Mặc định: làm việc từ thứ 2 đến thứ 6
// Nếu muốn làm đến 12h thứ 7, sửa logic bên dưới

export function isWorkDay(date: Date): boolean {
  const day = date.getDay();
  // Thứ 2 (1) đến thứ 6 (5) là ngày làm việc
  if (day >= 1 && day <= 5) return true;
  // Nếu muốn làm đến 12h thứ 7:
  // if (day === 6 && date.getHours() < 12) return true;
  return false;
} 