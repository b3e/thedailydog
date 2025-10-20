"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = stored ? stored === "dark" : prefersDark;
    setIsDark(shouldDark);
    document.documentElement.classList.toggle("dark", shouldDark);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    const onResize = () =>
      setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    onResize();
    onScroll();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const showCenterLogo = isDesktop && !isScrolled;

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <header
      className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-all duration-200 ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`relative flex items-center ${
            showCenterLogo ? "justify-center" : "justify-between"
          } h-20`}
        >
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center space-x-3 group transition-all duration-200 ${
              showCenterLogo ? "absolute left-1/2 -translate-x-1/2" : ""
            }`}
          >
            <div className="relative">
              <img
                src={showCenterLogo ? "/logo-slogan.png" : "/logo.png"}
                alt={
                  showCenterLogo
                    ? "The Daily Dog — Guarding America's Values."
                    : "The Daily Dog"
                }
                className={`${
                  showCenterLogo ? "h-18" : "h-12"
                } w-auto object-contain group-hover:scale-105 transition-transform duration-200`}
              />
            </div>
            <div className="flex flex-col">
              <span className="sr-only">Guarding America's Values.</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className={`hidden md:flex items-center space-x-8 transition-opacity duration-150 ${
              showCenterLogo ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/?topic=Politics"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
            >
              Politics
            </Link>
            <Link
              href="/?topic=Economy"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
            >
              Economy
            </Link>
            <Link
              href="/?topic=Culture"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
            >
              Culture
            </Link>
            <Link
              href="/?topic=Opinion"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
            >
              Opinion
            </Link>
          </nav>

          {/* Right side actions */}
          <div
            className={`flex items-center space-x-4 transition-opacity duration-150 ${
              showCenterLogo ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* Search (placeholder) */}
            <button
              type="button"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <nav className="px-4 py-3 space-y-1">
            <Link
              onClick={() => setMobileOpen(false)}
              href="/"
              className="block px-2 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Home
            </Link>
            <Link
              onClick={() => setMobileOpen(false)}
              href="/?topic=Politics"
              className="block px-2 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Politics
            </Link>
            <Link
              onClick={() => setMobileOpen(false)}
              href="/?topic=Economy"
              className="block px-2 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Economy
            </Link>
            <Link
              onClick={() => setMobileOpen(false)}
              href="/?topic=Culture"
              className="block px-2 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Culture
            </Link>
            <Link
              onClick={() => setMobileOpen(false)}
              href="/?topic=Opinion"
              className="block px-2 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Opinion
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
