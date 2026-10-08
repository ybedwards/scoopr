import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoopr Admin",
  description: "Approve scoopers, set prices and manage the service area.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
