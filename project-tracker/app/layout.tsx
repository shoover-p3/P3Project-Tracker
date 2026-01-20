import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Tracker - Phase 3",
  description: "Simple project management for Phase 3 teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
