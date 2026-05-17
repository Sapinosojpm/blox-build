import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#070A0F] border-t border-white/5 py-10 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blox-red text-white font-extrabold text-sm">
                B
              </div>
              <span className="text-sm font-bold tracking-tight text-white">
                BLOX<span className="text-blox-cyan">BUILD</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 mt-2 text-center md:text-left">
              The premier Roblox Bloxburg community build repository & commission exchange hub.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-xs text-gray-400 font-semibold">
            <Link href="/explore" className="hover:text-white transition-colors">
              Explore Builds
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Plans & Pricing
            </Link>
            <a
              href="https://welcome-to-bloxburg.fandom.com/wiki/Welcome_to_Bloxburg_Wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Bloxburg Wiki
            </a>
          </div>
        </div>

        <hr className="border-white/5 my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-600 font-medium">
          <p>© {new Date().getFullYear()} BloxBuild Hub. Not affiliated with Roblox Corporation or Coeptus.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-400">Terms of Service</a>
            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
