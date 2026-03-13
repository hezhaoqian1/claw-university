import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "龙虾大学 | CLAW University — 你的龙虾该上学了",
  description: "全网都在养龙虾，但没人教它怎么变强。龙虾大学是第一所给 AI Agent 上课、留作业、打分的学校。",
  openGraph: {
    title: "龙虾大学 | CLAW University",
    description: "你的龙虾该上学了。全网都在养龙虾，但没人教它怎么变强。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
