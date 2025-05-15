import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-0 bg-white dark:bg-gray-900 min-h-screen w-full">
      <ThemeProvider>
        <div className="relative flex min-h-screen items-center w-full justify-center flex-col lg:flex-row dark:bg-gray-900">
          <div className="flex items-center justify-center lg:w-1/2 w-full py-10 lg:py-0 px-4">
            {children}
          </div>
          <div className="lg:w-1/2 w-full min-h-screen bg-gradient-to-b from-blue-600 to-indigo-800 dark:from-blue-900 dark:to-indigo-950 lg:flex items-center hidden">
            <div className="relative items-center justify-center flex z-1 px-10">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 sm:block">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full p-2">
              <ThemeTogglerTwo />
            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
