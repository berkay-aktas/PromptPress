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
          <div className="min-h-screen flex flex-col bg-[#faf9f7] text-[#1c1917]">
            {/* HEADER: Navigation Bar with Gradient */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-[var(--card-border)] sticky top-0 z-40 shadow-primary/20">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  {/* Logo/Title with Gradient */}
                  <Link href="/" className="flex items-center">
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      Prompt <span className="gradient-text">Press</span>
                    </h1>
                  </Link>

                  {/* Navigation Links */}
                  <Navigation />
                </div>
              </div>
            </header>

          {/* MAIN: Dynamic Content Area */}
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {children}
          </main>

            {/* FOOTER with Subtle Gradient */}
            <footer className="bg-gradient-to-b from-white to-[var(--background)] border-t border-[var(--card-border)] mt-auto">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <p className="text-center text-xs text-[var(--text-muted)]">
                  © 2025 Prompt <span className="gradient-text font-semibold">Press</span> - AI Powered
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
