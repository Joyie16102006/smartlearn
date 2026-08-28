import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartLearn — AI-Powered Personalized Adaptive Learning Platform",
  description:
    "Tell us what you want to learn. We'll tell you what to learn next. Dynamic roadmaps, Socratic AI tutoring, Bayesian knowledge tracing, and spaced repetition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
