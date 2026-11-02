'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function SiteFooter() {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <Link href="/" className="brand-section">
            <div className="brand-logo">N</div>
            <span className="brand-name">Novelo</span>
          </Link>
          <span className="footer-copyright">
            © {new Date().getFullYear()} Novelo. All rights reserved.
          </span>
        </div>

        <div className="footer-right">
          <div className="theme-toggle-container">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
              aria-label="Toggle Dark Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} color="#fbbf24" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={15} color="#6366f1" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
