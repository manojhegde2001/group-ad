'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export type ColorTheme = 'blue' | 'purple' | 'green' | 'orange' | 'red';
export type FontFamily = 'inter' | 'roboto' | 'poppins' | 'montserrat';

export function useThemeConfig() {
  const { user } = useAuth();
  const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');
  const [fontFamily, setFontFamily] = useState<FontFamily>('inter');

  useEffect(() => {
    // Priority: Session (Category) > LocalStorage > Default
    const sessionTheme = (user as any)?.colorTheme as ColorTheme;
    const sessionFont = (user as any)?.fontFamily as FontFamily;

    const savedTheme = localStorage.getItem('color-theme') as ColorTheme;
    const savedFont = localStorage.getItem('font-family') as FontFamily;

    if (sessionTheme) {
      setColorTheme(sessionTheme);
    } else if (savedTheme) {
      setColorTheme(savedTheme);
    }

    if (sessionFont) {
      setFontFamily(sessionFont);
    } else if (savedFont) {
      setFontFamily(savedFont);
    }
  }, [user]);


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    localStorage.setItem('color-theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.classList.remove('font-inter', 'font-roboto', 'font-poppins', 'font-montserrat');
    document.documentElement.classList.add(`font-${fontFamily}`);
    localStorage.setItem('font-family', fontFamily);
  }, [fontFamily]);

  return {
    colorTheme,
    setColorTheme,
    fontFamily,
    setFontFamily,
  };
}
