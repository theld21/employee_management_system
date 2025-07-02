import type { Metadata } from "next";
import HomeNewsClient from "@/components/news/HomeNewsClient";

export const metadata: Metadata = {
  title: "WSM | Home",
  description: "Trang chủ",
};

export default function HomeNewsPage() {
  return <HomeNewsClient />;
}
