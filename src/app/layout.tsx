import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "candle-board · 蜡烛图交易看板",
  description: "辅助工具，非投资建议。形态初筛 + 六层过滤 + 人工终审。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-[#090b10] text-[#d7dde8] antialiased">
        {children}
      </body>
    </html>
  );
}
