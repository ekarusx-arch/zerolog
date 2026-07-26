import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MonthlyCalendar.module.css';

const MOOD_COLORS = {
  great: '#10b981',
  good: '#3b82f6',
  okay: '#f59e0b',
  bad: '#ef4444',
  awful: '#8b5cf6',
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

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
  const weekCount = Math.ceil((firstDay + daysInMonth) / 7);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = `${month + 1}월`;

  // Map logs by date string (YYYY-MM-DD)
  const logsByDate = {};
  logs.forEach(log => {
    if (log.date) {
      const logDate = new Date(log.date);
      const dateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
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
        <button
          type="button"
          key={day} 
          className={`${styles.dateCell} ${isToday(day) ? styles.today : ''} ${logForDay ? styles.hasLog : ''}`} 
          onClick={() => logForDay && onDateClick && onDateClick(dateStr)}
          disabled={!logForDay}
          aria-label={logForDay ? `${dateStr} 회고 보기` : `${dateStr} 기록 없음`}
        >
          <span className={styles.dateNumber}>{day}</span>
          {logForDay && (
            <div className={styles.logSummaryContainer}>
              <div 
                className={styles.moodIndicator} 
                style={{ backgroundColor: MOOD_COLORS[logForDay.mood] }}
                title={`기분: ${logForDay.mood}`}
              />
              <div className={styles.logSummaryText} title={logForDay.q1}>
                {logForDay.q1}
              </div>
            </div>
          )}
        </button>
      );
    }

    // Fill remaining cells for a complete grid (optional, but keeps table rectangular)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(<div key={`empty-end-${i}`} className={`${styles.dateCell} ${styles.empty}`}></div>);
    }

    return cells;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.monthTitle}>{monthName} {year}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={styles.navButton} onClick={prevMonth} aria-label="이전 달"><ChevronLeft size={20} /></button>
          <button className={styles.navButton} onClick={nextMonth} aria-label="다음 달"><ChevronRight size={20} /></button>
        </div>
      </div>
      
      <div className={styles.weekdays}>
        {DAY_NAMES.map(day => (
          <div key={day} className={styles.dayName}>{day}</div>
        ))}
      </div>
      <div
        className={styles.grid}
        style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
      >
        {renderCells()}
      </div>
    </div>
  );
}
