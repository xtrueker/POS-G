import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-none border border-transparent hover:border-zinc-200 dark:border-zinc-800 dark:hover:border-zinc-800 transition-all active:scale-95 group relative overflow-hidden"
      aria-label="Toggle Theme"
    >
      <div className="relative w-4 h-4">
        <Sun className={`absolute inset-0 w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-all duration-500 ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
        <Moon className={`absolute inset-0 w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-all duration-500 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
      </div>
    </button>
  );
}

