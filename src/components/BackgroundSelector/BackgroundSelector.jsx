import React, { useState, useRef, useEffect } from 'react';
import styles from './BackgroundSelector.module.css';

const THEMES = [
  { id: 'aurora', name: 'Aurora', color: 'linear-gradient(135deg, #f0f9ff, #f3e8ff)' },
  { id: 'sunset', name: 'Sunset', color: 'linear-gradient(135deg, #fff7ed, #ffedd5)' },
  { id: 'ocean', name: 'Ocean', color: 'linear-gradient(135deg, #f0fdfa, #e0f2fe)' },
  { id: 'nature', name: 'Nature', color: 'linear-gradient(135deg, #f0fdf4, #fefce8)' },
  { id: 'night', name: 'Night', color: 'linear-gradient(135deg, #0f172a, #1e293b)' },
];

export default function BackgroundSelector({ currentTheme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={`${styles.toggleButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="배경 테마 변경"
      >
        <span className={styles.icon}>🎨</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>배경 테마</span>
          </div>
          <div className={styles.themeList}>
            {THEMES.map(theme => (
              <button
                key={theme.id}
                className={`${styles.themeOption} ${currentTheme === theme.id ? styles.selected : ''}`}
                onClick={() => {
                  onThemeChange(theme.id);
                  setIsOpen(false);
                }}
              >
                <div 
                  className={styles.colorSwatch} 
                  style={{ background: theme.color }}
                />
                <span className={styles.themeName}>{theme.name}</span>
                {currentTheme === theme.id && <span className={styles.checkIcon}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
