import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squire · 国际象棋复盘教练",
  description: "结合 Stockfish 本地引擎和 AI 教练的国际象棋复盘工具。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
