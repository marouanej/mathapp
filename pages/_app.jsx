import '../styles/globals.css';
import Head from 'next/head';
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return undefined;
    }

    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerServiceWorker();

    return undefined;
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
