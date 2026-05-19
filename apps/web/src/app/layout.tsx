import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'Cleanslate', description: 'Your financial closet manager.' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
          <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-semibold">Cleanslate</Link>
            <Link href="/sources" className="text-sm text-zinc-600 hover:text-black">Sources</Link>
            <Link href="/actions" className="text-sm text-zinc-600 hover:text-black">Actions</Link>
            <Link href="/anomalies" className="text-sm text-zinc-600 hover:text-black">Anomalies</Link>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
