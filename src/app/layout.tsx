import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OS Stories",
  description: "The story of operating systems, told through scroll.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
