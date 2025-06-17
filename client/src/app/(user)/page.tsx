import type { Metadata } from "next";
import HomeNewsClient from "@/components/news/HomeNewsClient";

export const metadata: Metadata = {
  title: "Tin tức | Dashboard",
  description: "Trang tin tức nội bộ",
};

export default function HomeNewsPage() {
  return <HomeNewsClient />;
}
