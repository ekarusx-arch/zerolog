import { useState, useEffect } from 'react'
import Layout from './components/Layout/Layout'
import ChatReflection from './components/ChatReflection/ChatReflection'
import DayView from './components/DayView/DayView'
import DashboardWidgets from './components/DashboardWidgets/DashboardWidgets'
import RetrospectiveTopics from './components/DashboardWidgets/RetrospectiveTopics'
import CalendarView from './components/CalendarView/CalendarView'
import AuthScreen from './components/AuthScreen/AuthScreen'
import BackgroundSelector from './components/BackgroundSelector/BackgroundSelector'
import { supabase } from './lib/supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentTab, setCurrentTab] = useState('write') // 'write' or 'calendar'
  const [calendarViewMode, setCalendarViewMode] = useState('monthly')
  const [bgTheme, setBgTheme] = useState(() => {
    const saved = localStorage.getItem('zerolog_bg_theme');
    if (saved === 'default' || saved === 'minimal') return 'night';
    return saved || 'night';
  });

  // Apply Background Theme
  useEffect(() => {
    document.body.setAttribute('data-theme', bgTheme);
    localStorage.setItem('zerolog_bg_theme', bgTheme);
  }, [bgTheme]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch Logs from Supabase when session exists
  useEffect(() => {
    if (!session?.user?.id) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      // Show loading screen only if it's the first load
      if (logs.length === 0) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('zerolog_entries')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setLogs(data);
      } else {
        console.error('Error fetching logs:', error);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [session?.user?.id]);

  // Update Aura Color whenever logs change
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[0];
      const moodColors = {
        great: 'rgba(16, 185, 129, 0.15)', // Emerald
        good: 'rgba(59, 130, 246, 0.15)', // Blue
        okay: 'rgba(245, 158, 11, 0.15)', // Amber
        bad: 'rgba(239, 68, 68, 0.15)', // Red
        awful: 'rgba(139, 92, 246, 0.15)', // Purple
      };
      document.body.style.setProperty('--aura-color', moodColors[latestLog.mood] || 'rgba(30, 41, 59, 0.5)');
    } else {
      document.body.style.setProperty('--aura-color', 'rgba(30, 41, 59, 0.5)');
    }
  }, [logs])

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAddLog = (newLog) => {
    setLogs([newLog, ...logs]);
  }

  const handleDeleteLog = async (id) => {
    if (!window.confirm('정말 이 기록을 삭제하시겠습니까?')) return;
    
    const { error } = await supabase
      .from('zerolog_entries')
      .delete()
      .eq('id', id);

    if (!error) {
      setLogs(logs.filter(log => log.id !== id));
    } else {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  }

  return (
    <Layout>
      {!session ? (
        <AuthScreen />
      ) : (
        <>
          <header style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem',
            flexShrink: 0,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.03em',
                margin: 0
              }}>
                ZeroLog
              </h1>
              
              {!selectedDate && (
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', padding: '0.3rem', borderRadius: '12px' }}>
                  <button 
                    onClick={() => setCurrentTab('write')}
                    style={{
                      padding: '0.4rem 1.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: currentTab === 'write' ? 'var(--color-bg-base)' : 'transparent',
                      color: currentTab === 'write' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: currentTab === 'write' ? 600 : 500,
                      boxShadow: currentTab === 'write' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    하루 회고
                  </button>
                  <button 
                    onClick={() => setCurrentTab('calendar')}
                    style={{
                      padding: '0.4rem 1.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: currentTab === 'calendar' ? 'var(--color-bg-base)' : 'transparent',
                      color: currentTab === 'calendar' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      fontWeight: currentTab === 'calendar' ? 600 : 500,
                      boxShadow: currentTab === 'calendar' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    회고 모아보기
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <BackgroundSelector currentTheme={bgTheme} onThemeChange={setBgTheme} />
              <button 
                onClick={handleLogout}
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                로그아웃
              </button>
            </div>
          </header>
          
          <main style={{ 
            display: 'grid', 
            gridTemplateColumns: selectedDate ? 'minmax(400px, 800px)' : (currentTab === 'write' ? 'minmax(300px, 1fr) minmax(300px, 1fr)' : '1fr'),
            justifyContent: selectedDate ? 'center' : 'stretch',
            gridTemplateRows: 'minmax(0, 1fr)',
            gap: '1.5rem',
            flex: 1,
            height: '100%',
            minHeight: 0
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem', gridColumn: '1 / -1' }}>기록을 불러오는 중...</div>
            ) : selectedDate ? (
              <DayView 
                selectedDate={selectedDate} 
                log={logs.find(l => l.date.startsWith(selectedDate))} 
                onBack={() => setSelectedDate(null)}
                onAddLog={(newLog) => {
                  handleAddLog(newLog);
                }}
                user={session.user}
              />
            ) : (
              <>
                {/* 1열: 질문지 (대화형 회고 폼) + 회고 추천 */}
                <div style={{ display: currentTab === 'write' ? 'flex' : 'none', flexDirection: 'column', height: '100%', minHeight: 0, gap: '1rem' }}>
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <ChatReflection onAddLog={handleAddLog} user={session.user} />
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <RetrospectiveTopics />
                  </div>
                </div>
                {/* 2열: 유튜브 플리 + 대시보드 위젯 */}
                <div style={{ display: currentTab === 'write' ? 'flex' : 'none', flexDirection: 'column', height: '100%', minHeight: 0, gap: '1.5rem' }}>
                  <div style={{ 
                    flexShrink: 0, 
                    background: 'var(--color-bg-base)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '16px', 
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>🎵 하루끝플리</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>음악과 함께 하루를 정리해보세요</span>
                    </div>
                    <iframe 
                      width="100%" 
                      src="https://www.youtube.com/embed/eHaxwrKR6to?autoplay=1&loop=1&playlist=eHaxwrKR6to" 
                      title="하루끝플리 플레이어" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      style={{ borderRadius: '12px', aspectRatio: '16/9', height: 'auto' }}
                    ></iframe>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.5rem', overflowX: 'hidden' }}>
                    <DashboardWidgets logs={logs} />
                  </div>
                </div>
                
                {/* 캘린더 모아보기 탭 */}
                <div style={{ display: currentTab === 'calendar' ? 'flex' : 'none', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  <CalendarView 
                    logs={logs} 
                    onDateClick={setSelectedDate} 
                    viewMode={calendarViewMode} 
                    setViewMode={setCalendarViewMode} 
                  />
                </div>
              </>
            )}
          </main>
        </>
      )}
    </Layout>
  )
}

export default App
