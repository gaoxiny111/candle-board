import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "candle-board · A股蜡烛图辅助看板",
  description: "技术分析学习辅助，非投资建议。A股形态初筛 + 六层过滤 + T+1 人工终审。",
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
