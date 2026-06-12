import React, { useState, useEffect } from 'react';
import RetrospectiveTopics from './RetrospectiveTopics';
import styles from './DashboardWidgets.module.css';

const MOOD_COLORS = {
  great: '#10b981',
  good: '#3b82f6',
  okay: '#f59e0b',
  bad: '#ef4444',
  awful: '#8b5cf6',
};

const MOOD_EMOJIS = {
  great: '🥰',
  good: '😊',
  okay: '😐',
  bad: '😔',
  awful: '😩'
};

const DashboardWidgets = ({ logs }) => {
  // Calculate current month's logs
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthLogs = logs.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Calculate Streak
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check today or yesterday as starting point
  const hasLogToday = logs.some(log => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === currentDate.getTime();
  });

  if (!hasLogToday) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count backwards
  for (let i = 0; i < 365; i++) {
    const hasLog = logs.some(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === currentDate.getTime();
    });
    
    if (hasLog) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate mood distribution for this month
  const moodCounts = { great: 0, good: 0, okay: 0, bad: 0, awful: 0 };
  thisMonthLogs.forEach(log => {
    if (moodCounts[log.mood] !== undefined) {
      moodCounts[log.mood]++;
    }
  });

  return (
    <div className={styles.container}>
      <RetrospectiveTopics />
      <h2 className={styles.sectionTitle}>ZeroInsight 대시보드</h2>
      <div className={styles.widgetsGrid}>
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetIcon}>🔥</span>
            <h3>나의 기록 열정</h3>
          </div>
          <div className={styles.streakContent}>
            <div className={styles.streakNumber}>{streak}<span>일</span></div>
            <div className={styles.streakLabel}>연속 기록 중입니다!</div>
          </div>
        </div>

        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetIcon}>📊</span>
            <h3>이번 달 기분 요약</h3>
          </div>
          <div className={styles.moodContent}>
            {thisMonthLogs.length === 0 ? (
              <div className={styles.emptyMood}>아직 이번 달 기록이 없습니다.</div>
            ) : (
              <div className={styles.moodBars}>
                {Object.keys(moodCounts).map(mood => {
                  const count = moodCounts[mood];
                  const percentage = Math.max((count / thisMonthLogs.length) * 100, count > 0 ? 5 : 0);
                  if (count === 0) return null;
                  
                  return (
                    <div key={mood} className={styles.moodRow}>
                      <span className={styles.moodEmoji}>{MOOD_EMOJIS[mood]}</span>
                      <div className={styles.barContainer}>
                        <div 
                          className={styles.barFill} 
                          style={{ width: `${percentage}%`, backgroundColor: MOOD_COLORS[mood] }}
                        ></div>
                      </div>
                      <span className={styles.moodCount}>{count}일</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWidgets;
