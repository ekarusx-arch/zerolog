import React from 'react';
import styles from './DayView.module.css';
import ReflectionForm from '../ReflectionForm/ReflectionForm';

const MOOD_COLORS = {
  great: 'var(--color-mood-great)',
  good: 'var(--color-mood-good)',
  okay: 'var(--color-mood-okay)',
  bad: 'var(--color-mood-bad)',
  awful: 'var(--color-mood-awful)',
};

const DayView = ({ selectedDate, log, onBack, onAddLog, user }) => {
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(selectedDate));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← 달력으로 돌아가기
        </button>
        <h2 className={styles.title}>{formattedDate}</h2>
      </div>

      <div className={styles.content}>
        {log ? (
          <div className={styles.logDetail}>
            <div className={styles.moodHeader}>
              <div 
                className={styles.moodDot} 
                style={{ backgroundColor: MOOD_COLORS[log.mood] }} 
              />
              <span className={styles.moodText}>오늘의 기분: {log.mood}</span>
            </div>
            
            {log.soundtrack && (
              <div className={styles.soundtrackBlock}>
                <span role="img" aria-label="headphones">🎧</span> <strong>사운드트랙:</strong> {log.soundtrack}
              </div>
            )}
            
            <div className={styles.qnaBlock}>
              <strong>오늘 가장 감사했던 일은?</strong>
              <p>{log.q1}</p>
            </div>
            
            <div className={styles.qnaBlock}>
              <strong>오늘 아쉬웠거나 배운 점은?</strong>
              <p>{log.q2}</p>
            </div>
            
            <div className={styles.qnaBlock}>
              <strong>내일을 위해 비워내야 할 생각은?</strong>
              <p>{log.q3}</p>
            </div>
          </div>
        ) : (
          <div className={styles.formWrapper}>
            <p className={styles.noLogMessage}>이 날의 기록이 없습니다. 새로운 기록을 남겨보세요.</p>
            <ReflectionForm onAddLog={onAddLog} user={user} overrideDate={selectedDate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;
