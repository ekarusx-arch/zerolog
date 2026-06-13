import { useState, useEffect, useMemo } from 'react';
import styles from './DashboardWidgets.module.css';

const MOOD_COLORS = {
  great: '#10b981',
  good: '#3b82f6',
  okay: '#f59e0b',
  bad: '#ef4444',
  awful: '#8b5cf6',
};

const MOOD_VALUES = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };
const MOOD_EMOJIS = { great: '🥰', good: '😊', okay: '😐', bad: '😔', awful: '😩' };

export default function DashboardWidgets({ logs }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Current Month Logs
  const thisMonthLogs = useMemo(() => {
    return logs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [logs, currentMonth, currentYear]);

  // 2. Streak Calculation
  const streak = useMemo(() => {
    let count = 0;
    let curr = new Date();
    curr.setHours(0, 0, 0, 0);

    const hasLogToday = logs.some(log => {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === curr.getTime();
    });

    if (!hasLogToday) {
      curr.setDate(curr.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const hasLog = logs.some(log => {
        const d = new Date(log.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === curr.getTime();
      });
      
      if (hasLog) {
        count++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [logs]);

  // 3. Mood Doughnut (This month)
  const moodCounts = useMemo(() => {
    const counts = { great: 0, good: 0, okay: 0, bad: 0, awful: 0 };
    thisMonthLogs.forEach(log => {
      if (counts[log.mood] !== undefined) counts[log.mood]++;
    });
    return counts;
  }, [thisMonthLogs]);

  // Calculate conic gradient stops
  const doughnutStyle = useMemo(() => {
    const total = thisMonthLogs.length;
    if (total === 0) return { background: 'var(--border-color)' };
    
    let currentPercentage = 0;
    const stops = [];
    ['great', 'good', 'okay', 'bad', 'awful'].forEach(mood => {
      const count = moodCounts[mood];
      if (count > 0) {
        const percentage = (count / total) * 100;
        stops.push(`${MOOD_COLORS[mood]} ${currentPercentage}% ${currentPercentage + percentage}%`);
        currentPercentage += percentage;
      }
    });
    
    return { background: `conic-gradient(${stops.join(', ')})` };
  }, [moodCounts, thisMonthLogs.length]);

  // 4. Best Moment
  const [bestMoment, setBestMoment] = useState(null);
  useEffect(() => {
    const greats = thisMonthLogs.filter(l => l.mood === 'great');
    const goods = thisMonthLogs.filter(l => l.mood === 'good');
    const candidates = greats.length > 0 ? greats : goods;
    
    if (candidates.length > 0) {
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      setBestMoment(random);
    } else {
      setBestMoment(null);
    }
  }, [thisMonthLogs]);

  // 5. Zero's Whisper (Last 3 days average)
  const zerosWhisper = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    
    for (let i = 0; i < 3; i++) {
      const target = new Date();
      target.setDate(target.getDate() - i);
      target.setHours(0,0,0,0);
      
      const log = logs.find(l => {
        const d = new Date(l.date);
        d.setHours(0,0,0,0);
        return d.getTime() === target.getTime();
      });
      
      if (log && MOOD_VALUES[log.mood]) {
        totalScore += MOOD_VALUES[log.mood];
        count++;
      }
    }
    
    if (count === 0) return "오늘 하루는 어떠셨나요? 제로에게 첫 이야기를 들려주세요. ✨";
    
    const avg = totalScore / count;
    if (avg >= 4.0) return "최근 기분이 아주 좋으시네요! 이 긍정적인 에너지를 계속 유지해보세요 😊";
    if (avg >= 3.0) return "잔잔하고 평온한 일상도 아주 소중한 순간들이랍니다. 🌿";
    if (avg >= 2.0) return "조금은 지치는 날들이었군요. 스스로에게 작은 선물을 주는 건 어떨까요? ☕";
    return "힘든 시간을 보내고 계시군요. 제로가 언제나 당신의 이야기를 들어줄게요. 🫂";
  }, [logs]);

  // 6. Mood Trend (Last 7 Days)
  const trendDays = useMemo(() => {
    const days = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      
      const log = logs.find(l => {
        const ld = new Date(l.date);
        ld.setHours(0,0,0,0);
        return ld.getTime() === d.getTime();
      });
      
      days.push({
        label: i === 0 ? '오늘' : dayNames[d.getDay()],
        value: log ? MOOD_VALUES[log.mood] : 0,
        color: log ? MOOD_COLORS[log.mood] : 'var(--border-color)',
        mood: log ? log.mood : null
      });
    }
    return days;
  }, [logs]);

  // 7. Activity Heatmap (Last 28 Days) aligned to weekdays
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const totalDaysToShow = 28;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalDaysToShow - 1));
    
    const startDayOfWeek = startDate.getDay(); // 0 is Sunday
    
    // Add empty padding so the first day aligns with its day of week
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ isPadding: true });
    }
    
    for (let i = totalDaysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const log = logs.find(l => {
        const ld = new Date(l.date);
        ld.setHours(0,0,0,0);
        return ld.getTime() === d.getTime();
      });
      
      days.push({
        date: d,
        active: !!log,
        color: log ? MOOD_COLORS[log.mood] : 'var(--color-border)',
        isPadding: false
      });
    }
    return days;
  }, [logs]);

  return (
    <div className={styles.container}>
      <div className={styles.dashboardHeader}>
        <h2 className={styles.sectionTitle}>ZeroInsight 대시보드</h2>
      </div>

      <div className={styles.widgetsGrid}>
        
        {/* Row 1: Streak, Zero's Whisper, Best Moment */}
        <div className={`${styles.widgetCard} ${styles.streakCard}`}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetIcon}>🔥</span>
            <h3>나의 기록 열정</h3>
          </div>
          <div className={styles.streakContent}>
            <div className={styles.streakNumber}>{streak}<span>일</span></div>
            <div className={styles.streakLabel}>연속 기록 중!</div>
          </div>
        </div>

        <div className={`${styles.widgetCard} ${styles.bestMomentCard}`}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetIcon}>🌟</span>
            <h3>이달의 베스트 모먼트</h3>
          </div>
          <div className={styles.bestMomentContent}>
            {bestMoment ? (
              <>
                <div className={styles.bestMomentDate}>
                  {new Date(bestMoment.date).toLocaleDateString()} {MOOD_EMOJIS[bestMoment.mood]}
                </div>
                <p className={styles.bestMomentText}>
                  "{(bestMoment.q2 || bestMoment.q1 || '').substring(0, 80)}
                  {(bestMoment.q2 || bestMoment.q1 || '').length > 80 ? '...' : ''}"
                </p>
              </>
            ) : (
              <div className={styles.emptyText}>아직 멋진 순간을 기다리고 있어요!</div>
            )}
          </div>
        </div>

        <div className={`${styles.widgetCard} ${styles.doughnutCard}`}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetIcon}>📊</span>
            <h3>기분 분포 (이번 달)</h3>
          </div>
          <div className={styles.doughnutContent}>
            {thisMonthLogs.length === 0 ? (
              <div className={styles.emptyText}>기록이 없습니다.</div>
            ) : (
              <div className={styles.doughnutWrapper}>
                <div className={styles.doughnutChart} style={doughnutStyle}>
                  <div className={styles.doughnutHole}>
                    <span className={styles.doughnutTotal}>{thisMonthLogs.length}일</span>
                  </div>
                </div>
                <div className={styles.doughnutLegend}>
                  {Object.keys(moodCounts).map(mood => {
                    if (moodCounts[mood] === 0) return null;
                    return (
                      <div key={mood} className={styles.legendItem}>
                        <span className={styles.legendColor} style={{backgroundColor: MOOD_COLORS[mood]}}></span>
                        <span className={styles.legendEmoji}>{MOOD_EMOJIS[mood]}</span>
                        <span className={styles.legendCount}>{Math.round((moodCounts[mood] / thisMonthLogs.length) * 100)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Activity Heatmap */}
        <div className={`${styles.widgetCard} ${styles.heatmapCard}`}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetIcon}>🌱</span>
            <h3>최근 4주 활동 히트맵</h3>
          </div>
          <div className={styles.heatmapContent}>
            <div className={styles.heatmapWrapper}>
              <div className={styles.heatmapLabels}>
                <span>일</span>
                <span></span>
                <span>화</span>
                <span></span>
                <span>목</span>
                <span></span>
                <span>토</span>
              </div>
              <div className={styles.heatmapGrid}>
                {heatmapDays.map((day, idx) => (
                  day.isPadding ? (
                    <div key={idx} className={styles.heatmapSquarePadding}></div>
                  ) : (
                    <div 
                      key={idx} 
                      className={`${styles.heatmapSquare} ${day.active ? styles.activeSquare : ''}`}
                      style={{ backgroundColor: day.color }}
                      title={`${day.date.toLocaleDateString()} - ${day.active ? '기록됨' : '비어있음'}`}
                    ></div>
                  )
                ))}
              </div>
            </div>
            <div className={styles.heatmapLegend}>
              <span>마우스를 올려 날짜를 확인하세요</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
