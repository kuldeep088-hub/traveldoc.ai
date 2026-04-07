import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "TravelDoc AI — Find the Best Doctor in Any City",
  description:
    "AI-powered doctor finder for travelers and new residents. Search by city, specialty, and language. Get personalized recommendations and book appointments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
