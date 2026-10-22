import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nextjob",
  description: "A simple Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-600 text-white">
        {children}
      </body>
    </html>
  );
}
