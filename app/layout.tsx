import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Docteur Robot',
  description: 'Assistant de triage m?dical (non substitut ? un m?decin)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
