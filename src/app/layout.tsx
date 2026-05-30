import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserProvider } from "@/lib/UserContext";
import type { Metadata } from 'next';
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Movie Hub',
  description: 'Your ultimate movie download platform',
  icons: {
    icon: '/popcon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://cmp.gatekeeperconsent.com/min.js" data-cfasync="false" />
        <Script src="https://the.gatekeeperconsent.com/cmp.min.js" data-cfasync="false" />
        <Script async src="//www.ezojs.com/ezoic/sa.min.js" />
        <Script
          id="ezoic-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.ezstandalone = window.ezstandalone || {};
              ezstandalone.cmd = ezstandalone.cmd || [];
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}>
        <UserProvider>
          <Navbar />
          {children}
          <Footer />
        </UserProvider>
        <Script
          id="service-worker"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then(registration => console.log('SW registered'))
                  .catch(error => console.log('SW registration failed'));
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
