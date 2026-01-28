'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Palette, Type, Check } from 'lucide-react';
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
        <Popover.Content className="p-3 w-44 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
          <Text className="text-xs font-medium mb-2 text-secondary-600 dark:text-secondary-400">
            Color Theme
          </Text>
          <div className="grid grid-cols-2 gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setColorTheme(t.value as any)}
                className={`flex items-center justify-center p-2 rounded-md transition-all relative ${
                  colorTheme === t.value
                    ? 'bg-secondary-100 dark:bg-secondary-700/50'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-700/50'
                }`}
              >
                <span
                  className="w-8 h-8 rounded-full border-2 border-secondary-200 dark:border-secondary-600"
                  style={{ backgroundColor: t.color }}
                />
                {colorTheme === t.value && (
                  <Check className="w-3.5 h-3.5 absolute top-1 right-1 text-primary" />
                )}
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
        <Popover.Content className="p-3 w-40 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
          <Text className="text-xs font-medium mb-2 text-secondary-600 dark:text-secondary-400">
            Font Family
          </Text>
          <div className="grid gap-1.5">
            {FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFontFamily(f.value as any)}
                className={`flex items-center gap-2.5 text-sm px-3 py-1.5 rounded-md transition-all ${
                  fontFamily === f.value
                    ? 'bg-secondary-100 dark:bg-secondary-700/50 font-medium'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-700/50'
                }`}
              >
                <span style={{ fontFamily: f.value }}>{f.name}</span>
                {fontFamily === f.value && (
                  <Check className="w-4 h-4 ml-auto text-primary" />
                )}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
}
