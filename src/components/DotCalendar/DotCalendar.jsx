import { useState } from 'react';
import styles from './DotCalendar.module.css';
import { supabase } from '../../lib/supabaseClient';

const MOOD_COLORS = {
  great: 'var(--color-mood-great)',
  good: 'var(--color-mood-good)',
  okay: 'var(--color-mood-okay)',
  bad: 'var(--color-mood-bad)',
  awful: 'var(--color-mood-awful)',
};

const DotCalendar = ({ logs, onDeleteLog, user, onDateClick }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (!logs || logs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>아직 기록이 없습니다. 오늘 하루를 비워보세요.</p>
      </div>
    );
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }).format(d);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>내 기록</h2>
      <div className={styles.timeline}>
        {logs.map((log) => (
          <div key={log.id} className={styles.logItem}>
            <div className={styles.logHeader}>
              <div className={styles.dateAndDot} onClick={() => onDateClick ? onDateClick(log.date.split('T')[0]) : toggleExpand(log.id)} style={{ cursor: onDateClick ? 'pointer' : 'default' }}>
                <div 
                  className={styles.moodDot} 
                  style={{ backgroundColor: MOOD_COLORS[log.mood] }} 
                />
                <span className={styles.date}>{formatDate(log.date)}</span>
                {log.soundtrack && (
                  <span className={styles.soundtrackIcon} title={log.soundtrack}>🎧</span>
                )}
              </div>
              <div className={styles.headerActions}>
                <button 
                  className={styles.deleteButton} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLog(log.id);
                  }}
                  title="기록 삭제"
                >
                  🗑️
                </button>
                <button className={styles.expandButton} onClick={() => toggleExpand(log.id)}>
                  {expandedId === log.id ? '−' : '+'}
                </button>
              </div>
            </div>
            
            <div className={`${styles.logContent} ${expandedId === log.id ? styles.expanded : ''}`}>
              {log.soundtrack && (
                <div className={styles.soundtrackBlock}>
                  <span role="img" aria-label="headphones">🎧</span> <strong>사운드트랙:</strong> {log.soundtrack}
                </div>
              )}
              <div className={styles.qnaBlock}>
                <strong>감사했던 일</strong>
                <p>{log.q1}</p>
              </div>
              <div className={styles.qnaBlock}>
                <strong>배운 점</strong>
                <p>{log.q2}</p>
              </div>
              <div className={styles.qnaBlock}>
                <div className={styles.qnaHeaderWithExport}>
                  <strong>비워낼 생각</strong>
                </div>
                <p>{log.q3}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DotCalendar;
