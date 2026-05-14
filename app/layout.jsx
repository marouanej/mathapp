import '../styles/globals.css';

export const metadata = {
  title: 'Escape Math - Mobile Game',
  description: 'Solve math puzzles to escape 5 rooms',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
