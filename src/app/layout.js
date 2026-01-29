import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PaiMai - AI Content Generator สำหรับผู้ประกอบการชุมชน",
  description: "สร้างคอนเทนต์อัตลักษณ์ท้องถิ่น ได้ในปุ่มเดียว - AI ผู้ช่วยผู้ประกอบการชุมชน",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
