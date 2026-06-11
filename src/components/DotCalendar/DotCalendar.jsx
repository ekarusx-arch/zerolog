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

const DotCalendar = ({ logs, onDeleteLog, user }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

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

  const handleExportToZeroSlate = async (logId, text) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    setExportingId(logId);
    
    const { error } = await supabase
      .from('brain_dumps')
      .insert([{
        user_id: user.id,
        content: text,
        color: 'gray' // Default color for exported logs
      }]);

    setExportingId(null);

    if (error) {
      console.error('Error exporting to ZeroSlate:', error);
      alert('ZeroSlate로 전송하는 중 오류가 발생했습니다.');
    } else {
      alert('ZeroSlate Brain Dump로 성공적으로 전송되었습니다! 🚀\n내일 아침 ZeroSlate에서 확인해보세요.');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>내 기록</h2>
      <div className={styles.timeline}>
        {logs.map((log) => (
          <div key={log.id} className={styles.logItem}>
            <div className={styles.logHeader}>
              <div className={styles.dateAndDot} onClick={() => toggleExpand(log.id)}>
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
                  <button 
                    className={styles.exportButton}
                    onClick={() => handleExportToZeroSlate(log.id, log.q3)}
                    disabled={exportingId === log.id}
                    title="ZeroSlate 생태계로 동기화하기"
                  >
                    {exportingId === log.id ? '전송 중...' : 'ZeroSlate로 보내기 ↗'}
                  </button>
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
