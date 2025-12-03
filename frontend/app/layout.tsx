import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
                <nav className="flex items-center gap-3 sm:gap-4">
                  <Link
                    href="/feed"
                    className="text-sm sm:text-base text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
                  >
                    Feed
                  </Link>

                  <Link
                    href="/profile"
                    className="text-sm sm:text-base text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/admin"
                    className="text-sm sm:text-base text-gray-700 hover:text-indigo-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1"
                  >
                    Admin
                  </Link>

                  {/* Create Button */}
                  <Link
                    href="/create"
                    className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-sm"
                  >
                    + New Draft
                  </Link>
                </nav>
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
      </body>
    </html>
  );
}
