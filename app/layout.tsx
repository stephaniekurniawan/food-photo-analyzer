import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Dining Scene — 5-Market Food Research',
  description: 'Food photo analysis across SG, ID, JP, MY, PH',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
