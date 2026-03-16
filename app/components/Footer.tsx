import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1a2744] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/GOYA Logo White.png"
                alt="GOYA"
                style={{ width: '120px', height: 'auto' }}
              />
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              Global Online Yoga Association — connecting yoga teachers, students, schools, and
              wellness practitioners across the world since 2015.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#2dd4bf]/20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#2dd4bf]/20 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-5 uppercase tracking-widest">Community</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/members" className="hover:text-[#2dd4bf] transition-colors">Member Directory</Link></li>
              <li><Link href="#" className="hover:text-[#2dd4bf] transition-colors">Events & Trainings</Link></li>
              <li><Link href="#" className="hover:text-[#2dd4bf] transition-colors">Resources</Link></li>
              <li><Link href="#" className="hover:text-[#2dd4bf] transition-colors">Designations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs mb-5 uppercase tracking-widest">Organization</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-[#2dd4bf] transition-colors">About GOYA</Link></li>
              <li><Link href="#" className="hover:text-[#2dd4bf] transition-colors">Standards & Ethics</Link></li>
              <li><Link href="/privacy" className="hover:text-[#2dd4bf] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#2dd4bf] transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">© 2025 Global Online Yoga Association. All rights reserved.</p>
          <p className="text-xs">Built with intention for the global yoga community.</p>
        </div>
      </div>
    </footer>
  );
}
