import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InsertIQ — Iscar Learning",
  description: "Learn Iscar cutting inserts and grades",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <nav className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-14">
            <Link href="/" className="font-bold text-lg tracking-tight">
              InsertIQ
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/admin/grades" className="text-muted-foreground hover:text-foreground transition-colors">
                גריידים
              </Link>
              <Link href="/admin/inserts" className="text-muted-foreground hover:text-foreground transition-colors">
                שימות
              </Link>
              <Link href="/admin/import" className="text-muted-foreground hover:text-foreground transition-colors">
                ייבוא CSV
              </Link>
              <span className="text-border">|</span>
              <Link href="/learn/quiz" className="text-muted-foreground hover:text-foreground transition-colors">
                חידון
              </Link>
              <Link href="/learn/flashcards" className="text-muted-foreground hover:text-foreground transition-colors">
                כרטיסיות
              </Link>
              <Link href="/learn/match" className="text-muted-foreground hover:text-foreground transition-colors">
                התאמה
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
