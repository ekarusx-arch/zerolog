import React, { useState } from 'react';
import MonthlyCalendar from '../MonthlyCalendar/MonthlyCalendar';
import YearlyCalendar from '../YearlyCalendar/YearlyCalendar';
import styles from './CalendarView.module.css';

export default function CalendarView({ logs, onDateClick, viewMode, setViewMode }) {

  return (
    <div className={styles.container}>
      <div className={styles.toggleWrapper}>
        <div className={styles.toggleGroup}>
          <button 
            className={`${styles.toggleButton} ${viewMode === 'monthly' ? styles.active : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            월간 달력
          </button>
          <button 
            className={`${styles.toggleButton} ${viewMode === 'yearly' ? styles.active : ''}`}
            onClick={() => setViewMode('yearly')}
          >
            연간 전체보기
          </button>
        </div>
      </div>

      <div className={styles.viewContent}>
        {viewMode === 'monthly' ? (
          <MonthlyCalendar logs={logs} onDateClick={onDateClick} />
        ) : (
          <YearlyCalendar logs={logs} onDateClick={onDateClick} />
        )}
      </div>
    </div>
  );
}
