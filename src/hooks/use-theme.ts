'use client';

import { useEffect, useState } from 'react';

export type ColorTheme = 'blue' | 'purple' | 'green' | 'orange' | 'red';
export type FontFamily = 'inter' | 'roboto' | 'poppins' | 'montserrat';

export function useThemeConfig() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');
  const [fontFamily, setFontFamily] = useState<FontFamily>('inter');

  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme') as ColorTheme;
    const savedFont = localStorage.getItem('font-family') as FontFamily;

    if (savedTheme) setColorTheme(savedTheme);
    if (savedFont) setFontFamily(savedFont);
  }, []);

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
