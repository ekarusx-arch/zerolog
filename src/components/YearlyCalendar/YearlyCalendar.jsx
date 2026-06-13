import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './YearlyCalendar.module.css';

const MOOD_COLORS = {
  great: '#10b981',
  good: '#3b82f6',
  okay: '#f59e0b',
  bad: '#ef4444',
  awful: '#8b5cf6',
};

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function YearlyCalendar({ logs, onDateClick }) {
  const [year, setYear] = useState(new Date().getFullYear());

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

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.navButton} onClick={() => setYear(y => y - 1)}><ChevronLeft size={20} /></button>
        <h2 className={styles.yearTitle}>{year}년</h2>
        <button className={styles.navButton} onClick={() => setYear(y => y + 1)}><ChevronRight size={20} /></button>
      </div>
      
      <div className={styles.monthsGrid}>
        {MONTH_NAMES.map((monthName, monthIndex) => {
          const daysInMonth = getDaysInMonth(year, monthIndex);
          const firstDay = getFirstDayOfMonth(year, monthIndex);
          
          const cells = [];
          for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className={styles.dayCell}></div>);
          }
          
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const logForDay = logsByDate[dateStr];
            
            cells.push(
              <div 
                key={day} 
                className={`${styles.dayCell} ${logForDay ? styles.hasLog : ''}`}
                style={logForDay ? { backgroundColor: MOOD_COLORS[logForDay.mood] } : undefined}
                title={logForDay ? `${dateStr} - ${logForDay.mood}` : dateStr}
                onClick={() => logForDay && onDateClick && onDateClick(dateStr)}
              >
                {day}
              </div>
            );
          }

          return (
            <div key={monthName} className={styles.monthCard}>
              <h3 className={styles.monthName}>{monthName}</h3>
              <div className={styles.miniGrid}>
                {cells}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
