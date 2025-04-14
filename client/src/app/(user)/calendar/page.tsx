import AttendanceCalendar from "@/components/calendar/AttendanceCalendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Attendance Calendar",
  description: "View your monthly attendance records and check-in/check-out history",
};

export default function CalendarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Attendance Calendar" />
      <AttendanceCalendar />
    </div>
  );
}
