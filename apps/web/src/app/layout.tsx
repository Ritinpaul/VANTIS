import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { DemoProvider } from '@/lib/store';
import { AppShell } from '@/components/shell/AppShell';

export const metadata: Metadata = {
  title: 'VANTIS — Autonomous Multi-Agent Crisis Command Center',
  description:
    'Real-time civic defense and autonomous multi-agent adaptation engine for city crisis response with Gemini multimodal perception and GovernOS safety enforcement.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/civis-logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/civis-icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/civis-icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-primary antialiased">
        <DemoProvider>
          <AppShell>{children}</AppShell>
        </DemoProvider>
      </body>
    </html>
  );
}
