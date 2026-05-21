import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Short Clip Studio",
  description: "Analyze YouTube channel metadata and edit user-owned videos locally."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-studio-950 text-slate-100 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
