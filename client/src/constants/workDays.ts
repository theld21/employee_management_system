export const WORK_START_HOUR = 8;
export const WORK_START_MINUTE = 30;
export const WORK_END_HOUR = 17;
export const WORK_END_MINUTE = 30;
export const LUNCH_START_HOUR = 12;
export const LUNCH_START_MINUTE = 0;
export const LUNCH_END_HOUR = 13;
export const LUNCH_END_MINUTE = 0;
export const WORK_HOURS_REQUIRED = 8;

export function isWorkDay(date: Date): boolean {
  const day = date.getDay();
  // Thứ 2 (1) đến thứ 6 (5) là ngày làm việc
  if (day >= 1 && day <= 5) return true;
  // Nếu muốn làm đến 12h thứ 7:
  // if (day === 6 && date.getHours() < 12) return true;
  return false;
}

// Hàm lấy màu cho checkin
export function getCheckInColor(checkIn?: string): string {
  if (!checkIn) return '#9E9E9E';
  const checkInDate = new Date(checkIn);
  const workStart = new Date(checkInDate);
  workStart.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);
  return checkInDate > workStart ? '#F44336' : '#4CAF50';
}

// Hàm lấy màu cho checkout
export function getCheckOutColor(checkIn?: string, checkOut?: string): string {
  if (!checkOut) return '#F44336';
  const checkOutDate = new Date(checkOut);
  const workEnd = new Date(checkOutDate);
  workEnd.setHours(WORK_END_HOUR, WORK_END_MINUTE, 0, 0);

  // Nếu checkout trước giờ kết thúc thì màu đỏ
  if (checkOutDate < workEnd) return '#F44336';

  // Nếu có checkin, tính tổng thời gian làm việc (trừ nghỉ trưa)
  if (checkIn) {
    const checkInDate = new Date(checkIn);
    let totalMs = checkOutDate.getTime() - checkInDate.getTime();
    // Trừ thời gian nghỉ trưa nếu có giao với ca làm
    const lunchStart = new Date(checkInDate);
    lunchStart.setHours(LUNCH_START_HOUR, LUNCH_START_MINUTE, 0, 0);
    const lunchEnd = new Date(checkInDate);
    lunchEnd.setHours(LUNCH_END_HOUR, LUNCH_END_MINUTE, 0, 0);
    // Nếu checkin < lunchEnd và checkout > lunchStart thì có giao với nghỉ trưa
    if (checkInDate < lunchEnd && checkOutDate > lunchStart) {
      // Tính phần giao nhau giữa [checkIn, checkOut] và [lunchStart, lunchEnd]
      const overlapStart = Math.max(checkInDate.getTime(), lunchStart.getTime());
      const overlapEnd = Math.min(checkOutDate.getTime(), lunchEnd.getTime());
      if (overlapEnd > overlapStart) {
        totalMs -= (overlapEnd - overlapStart);
      }
    }
    const totalHours = totalMs / (1000 * 60 * 60);
    if (totalHours < WORK_HOURS_REQUIRED) return '#F44336'; // Insufficient hours - red
    if (totalHours > 12) return '#FF9800'; // Unusual hours (>12h) - orange warning
    if (totalHours > WORK_HOURS_REQUIRED + 2) return '#2196F3'; // Overtime (>10h) - blue
  }
  return '#4CAF50'; // Normal hours - green
}

// Hàm tính thời gian làm việc thực tế (giống logic backend)
export function calculateWorkHours(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Tính tổng thời gian
  let totalMs = checkOutDate.getTime() - checkInDate.getTime();

  // Trừ thời gian nghỉ trưa nếu có giao với ca làm
  const lunchStart = new Date(checkInDate);
  lunchStart.setHours(LUNCH_START_HOUR, LUNCH_START_MINUTE, 0, 0);
  const lunchEnd = new Date(checkInDate);
  lunchEnd.setHours(LUNCH_END_HOUR, LUNCH_END_MINUTE, 0, 0);

  if (checkInDate < lunchEnd && checkOutDate > lunchStart) {
    const overlapStart = Math.max(checkInDate.getTime(), lunchStart.getTime());
    const overlapEnd = Math.min(checkOutDate.getTime(), lunchEnd.getTime());
    if (overlapEnd > overlapStart) {
      totalMs -= (overlapEnd - overlapStart);
    }
  }

  return Math.max(0, totalMs / (1000 * 60 * 60));
} 