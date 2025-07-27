import type { Metadata } from 'next';
import './globals.css';
import { MidiConfigProvider } from '../contexts/MidiConfigContext';

export const metadata: Metadata = {
  title: 'Melody Sequencer V2',
  description: 'Modern AI-powered step sequencer built with Next.js and TypeScript',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MidiConfigProvider>
          {children}
        </MidiConfigProvider>
      </body>
    </html>
  );
}