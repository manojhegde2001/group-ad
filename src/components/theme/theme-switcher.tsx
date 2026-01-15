'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Palette, Type } from 'lucide-react';
import { Button, Popover, Text } from 'rizzui';
import { useThemeConfig } from '@/hooks/use-theme';
import { THEMES, FONTS } from '@/lib/constants';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, fontFamily, setFontFamily } = useThemeConfig();

  return (
    <div className="flex items-center gap-2">
      {/* Dark/Light Mode Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      {/* Color Theme Selector */}
      <Popover placement="bottom-end">
        <Popover.Trigger>
          <Button variant="outline" size="sm" className="p-2">
            <Palette className="w-4 h-4" />
          </Button>
        </Popover.Trigger>
        <Popover.Content className="p-4 w-48">
          <Text className="font-semibold mb-3">Color Theme</Text>
          <div className="space-y-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setColorTheme(t.value as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  colorTheme === t.value
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover>

      {/* Font Selector */}
      <Popover placement="bottom-end">
        <Popover.Trigger>
          <Button variant="outline" size="sm" className="p-2">
            <Type className="w-4 h-4" />
          </Button>
        </Popover.Trigger>
        <Popover.Content className="p-4 w-48">
          <Text className="font-semibold mb-3">Font Family</Text>
          <div className="space-y-2">
            {FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFontFamily(f.value as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-${f.value} ${
                  fontFamily === f.value
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
}
