"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
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

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") {
      return <SunIcon className="w-5 h-5" />;
    }
    if (theme === "dark") {
      return <MoonIcon className="w-5 h-5" />;
    }
    return (
      <div className="relative w-5 h-5">
        <SunIcon className="w-5 h-5 absolute" />
        <MoonIcon className="w-5 h-5 absolute opacity-50" />
      </div>
    );
  };

  const getLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground"
      title={`Current theme: ${getLabel()}`}
      aria-label={`Toggle theme, currently ${getLabel()}`}
    >
      {getIcon()}
    </button>
  );
}
