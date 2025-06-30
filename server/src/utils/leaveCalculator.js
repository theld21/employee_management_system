// Hàm tính số ngày nghỉ phép dựa trên thời gian bắt đầu và kết thúc
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

const isHalfDay = (time) => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Nếu bắt đầu sau 13:00 hoặc kết thúc trước 12:00 thì tính là nửa ngày
  return timeInMinutes >= 13 * 60 || timeInMinutes <= 12 * 60;
};

export function calculateLeaveDays(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Nếu cùng ngày
  if (start.toDateString() === end.toDateString()) {
    if (isWeekend(start)) return 0;
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    const endHour = end.getHours();
    const endMin = end.getMinutes();
    // Sáng đến 12:00 hoặc chiều đến 17:30 => 0.5 ngày
    if (
      (startHour < 13 && endHour < 13) ||
      (startHour >= 13 && endHour >= 13)
    ) {
      return 0.5;
    }
    // Sáng đến chiều
    return 1;
  }

  let days = 0;
  const current = new Date(start);

  // Ngày đầu tiên
  if (!isWeekend(current)) {
    if (start.getHours() < 13) {
      days += 1; // bắt đầu buổi sáng
    } else {
      days += 0.5; // bắt đầu buổi chiều
    }
  }

  // Các ngày ở giữa
  current.setDate(current.getDate() + 1);
  while (current.toDateString() !== end.toDateString()) {
    if (!isWeekend(current)) {
      days += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  // Ngày cuối cùng
  if (!isWeekend(end)) {
    if (end.getHours() < 13) {
      days += 0.5; // kết thúc buổi sáng
    } else {
      days += 1; // kết thúc buổi chiều
    }
  }

  return days;
}
