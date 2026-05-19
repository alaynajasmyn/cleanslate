import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Cleanslate — your financial closet manager',
  description: 'AI that watches your inbox + bank, detects subs, cancels what you don\'t use.',
};

const NAV = [
  { href: '/', label: 'Closet' },
  { href: '/sources', label: 'Sources' },
  { href: '/actions', label: 'Action queue' },
  { href: '/anomalies', label: 'Anomalies' },
  { href: '/spend', label: 'Spend' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/settings', label: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-[#1c1c2e] bg-[#0a0a0f]/80 backdrop-blur sticky top-0 z-20">
            <nav className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-1">
              <Link href="/" className="font-semibold mr-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <span>cleanslate</span>
              </Link>
              <div className="flex items-center gap-1 text-sm text-zinc-400">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="px-3 py-1.5 rounded-md hover:text-white hover:bg-[#11111a] transition">
                    {n.label}
                  </Link>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
                <span className="tag tag-good">demo</span>
                <span>v0.1.0</span>
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 glow">{children}</main>
          <footer className="border-t border-[#1c1c2e] py-4 text-center text-xs text-zinc-600">
            cleanslate · MIT · <a className="hover:text-zinc-400" href="https://github.com/alaynajasmyn/cleanslate" target="_blank" rel="noopener noreferrer">github</a>
          </footer>
        </div>
      </body>
    </html>
  );
}
