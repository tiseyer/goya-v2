export default function SlimFooter() {
  return (
    <footer className="bg-surface-muted border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-xs text-slate-500">© 2025 Global Online Yoga Association. All rights reserved.</p>
        <a
          href="https://seyer-marketing.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-primary transition-colors duration-150"
        >
          Powered by Seyer Marketing
        </a>
      </div>
    </footer>
  );
}
