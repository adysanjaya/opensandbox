"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  // resolvedTheme reflects the exact visual theme ('dark' or 'light')
  const currentTheme = resolvedTheme || theme || 'light';

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground group"
      title={`Beralih ke mode ${currentTheme === 'dark' ? 'terang (Light)' : 'gelap (Dark)'}`}
      aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {currentTheme === 'dark' ? (
        <SunIcon className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
      ) : (
        <MoonIcon className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}

