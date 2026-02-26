import Link from 'next/link';
import Logo from '../ui/logo';

const footerLinks = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-secondary-50 dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Top — brand + link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Logo className="w-24 h-7 mb-3" />
            <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed max-w-xs">
              Business-focused social networking platform for professionals and enterprises.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="font-semibold text-sm text-secondary-800 dark:text-secondary-200 mb-3">{section}</p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-secondary-200 dark:border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-secondary-500 dark:text-secondary-400">
            © {new Date().getFullYear()} Group Ad. All rights reserved.
          </p>
          <p className="text-xs text-secondary-400 dark:text-secondary-500">
            Made with ❤️ for professionals
          </p>
        </div>
      </div>
    </footer>
  );
}
