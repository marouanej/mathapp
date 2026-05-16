import '../styles/globals.css';

export const metadata = {
  title: 'Escape Math',
  description: 'Application mobile educative de quiz mathematiques.',
  applicationName: 'Escape Math',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Escape Math',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
