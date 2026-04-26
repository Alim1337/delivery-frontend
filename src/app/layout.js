import { Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "Delivery System",
  description: "Order & Delivery Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: "#1f2937", color: "#fff" },
            error: { style: { background: "#dc2626", color: "#fff" } },
            success: { style: { background: "#16a34a", color: "#fff" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}