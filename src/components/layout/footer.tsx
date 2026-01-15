import { Text } from 'rizzui';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary-50 dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Text className="font-bold text-lg mb-4">Group Ad</Text>
            <Text className="text-sm text-secondary-600 dark:text-secondary-400">
              Business-focused social networking platform for professionals and enterprises.
            </Text>
          </div>

          <div>
            <Text className="font-semibold mb-4">Product</Text>
            <div className="space-y-2">
              <Link href="/features" className="block text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary">
                Features
              </Link>
              <Link href="/pricing" className="block text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary">
                Pricing
              </Link>
            </div>
          </div>

          <div>
            <Text className="font-semibold mb-4">Company</Text>
            <div className="space-y-2">
              <Link href="/about" className="block text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary">
                About Us
              </Link>
              <Link href="/contact" className="block text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <Text className="font-semibold mb-4">Legal</Text>
            <div className="space-y-2">
              <Link href="/privacy" className="block text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-200 dark:border-secondary-800 text-center">
          <Text className="text-sm text-secondary-600 dark:text-secondary-400">
            © {new Date().getFullYear()} Group Ad. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  );
}
