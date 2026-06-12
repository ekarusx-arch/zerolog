import React, { useState } from 'react';
import styles from './MonthlyCalendar.module.css';

const MOOD_COLORS = {
  great: 'var(--color-mood-great)',
  good: 'var(--color-mood-good)',
  okay: 'var(--color-mood-okay)',
  bad: 'var(--color-mood-bad)',
  awful: 'var(--color-mood-awful)',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthlyCalendar({ logs, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });

  // Map logs by date string (YYYY-MM-DD)
  const logsByDate = {};
  logs.forEach(log => {
    if (log.date) {
      const logDate = new Date(log.date);
      // Ensure we match local date string
      const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
      // Keep the most recent log of the day if there are multiple
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = log;
      }
    }
  });

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const renderCells = () => {
    const cells = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className={`${styles.dateCell} ${styles.empty}`}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const logForDay = logsByDate[dateStr];

      cells.push(
        <div 
          key={day} 
          className={`${styles.dateCell} ${isToday(day) ? styles.today : ''}`} 
          title={logForDay ? `기분: ${logForDay.mood}` : ''}
          onClick={() => onDateClick && onDateClick(dateStr)}
          style={{ cursor: 'pointer' }}
        >
          {logForDay && (
            <div 
              className={styles.moodDot} 
              style={{ backgroundColor: MOOD_COLORS[logForDay.mood] }}
            />
          )}
          {day}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.monthTitle}>{monthName} {year}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={styles.navButton} onClick={prevMonth}>&lt;</button>
          <button className={styles.navButton} onClick={nextMonth}>&gt;</button>
        </div>
      </div>
      
      <div className={styles.grid}>
        {DAY_NAMES.map(day => (
          <div key={day} className={styles.dayName}>{day}</div>
        ))}
        {renderCells()}
      </div>
    </div>
  );
}
