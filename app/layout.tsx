import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "食事の風景 | Food Photo Encyclopedia",
  description: "グローバル食事写真データベース - AI画像分析付き",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
