import { Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "DeliverFlow",
  description: "Smart delivery management",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DeliverFlow",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "DeliverFlow",
    title: "DeliverFlow",
    description: "Smart delivery management",
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DeliverFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: "10px", fontFamily: "inherit" },
          }}
        />
         <InstallPrompt />
        {children}
      </body>
    </html>
  );
}