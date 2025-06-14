import AttendanceCalendar from "@/components/calendar/AttendanceCalendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Chấm công",
  description: "Xem lịch chấm công của bạn và lịch sử điểm danh",
};

export default function CalendarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Chấm công" />
      <AttendanceCalendar />
    </div>
  );
}
