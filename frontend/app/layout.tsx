import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "./contexts/AuthContext";
import { Navigation } from "./components/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prompt Press",
  description: "AI-powered drafting and publishing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} break-words overflow-x-hidden antialiased`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
            {/* HEADER: Navigation Bar */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  {/* Logo/Title */}
                  <Link href="/" className="flex items-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                      Prompt Press
                    </h1>
                  </Link>

                  {/* Navigation Links */}
                  <Navigation />
                </div>
              </div>
            </header>

          {/* MAIN: Dynamic Content Area */}
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

            {/* FOOTER */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <p className="text-center text-sm text-gray-500">
                  © 2025 Prompt Press - AI Powered
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
