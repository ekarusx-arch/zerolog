import React, { useState } from 'react';
import styles from './DayView.module.css';
import { supabase } from '../../lib/supabaseClient';

const MOOD_COLORS = {
  great: 'var(--color-mood-great)',
  good: 'var(--color-mood-good)',
  okay: 'var(--color-mood-okay)',
  bad: 'var(--color-mood-bad)',
  awful: 'var(--color-mood-awful)',
};

const DayView = ({ selectedDate, log, onBack, onAddLog, user }) => {
  const [exportingId, setExportingId] = useState(null);

  const handleExportToZeroSlate = async (logId, text) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    setExportingId(logId);
    
    // Parse time tags like [14:30]
    const timeTagRegex = /\[\d{2}:\d{2}\]/g;
    const timeTags = text.match(timeTagRegex) || [];
    
    // Parse hashtags like #idea #할일
    const hashTagRegex = /#[\w가-힣]+/g;
    const hashTags = text.match(hashTagRegex) || [];
    
    const metadata = {
      timeTags,
      hashTags,
      exportedFrom: 'ZeroLog',
      originalLogId: logId
    };

    const { error } = await supabase
      .from('brain_dumps')
      .insert([{
        user_id: user.id,
        content: text,
        color: 'gray', // Default color for exported logs
        metadata: metadata
      }]);

    setExportingId(null);

    if (error) {
      console.error('Error exporting to ZeroSlate:', error);
      alert('ZeroSlate로 전송하는 중 오류가 발생했습니다.');
    } else {
      alert('ZeroSlate Brain Dump로 성공적으로 전송되었습니다! 🚀\n내일 아침 ZeroSlate에서 확인해보세요.');
    }
  };

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>내일을 위해 비워내야 할 생각은?</strong>
                <button 
                  onClick={() => handleExportToZeroSlate(log.id, log.q3)}
                  disabled={exportingId === log.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-text-secondary)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {exportingId === log.id ? '전송 중...' : 'ZeroSlate로 보내기 ↗'}
                </button>
              </div>
              <p>{log.q3}</p>
            </div>
          </div>
        ) : (
          <div className={styles.formWrapper}>
            <p className={styles.noLogMessage}>이 날의 기록이 비워져 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;
