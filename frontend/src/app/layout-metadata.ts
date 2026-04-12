import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nexus Intelligence - AI-Powered Decision Intelligence Platform',
  description: 'Transform raw data into actionable insights through natural language interaction',
  keywords: ['AI', 'Business Intelligence', 'Decision Intelligence', 'Analytics', 'Forecasting'],
  authors: [{ name: 'Nexus Intelligence Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};
