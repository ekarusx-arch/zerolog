import { useState, useEffect } from 'react'
import Layout from './components/Layout/Layout'
import ChatReflection from './components/ChatReflection/ChatReflection'
import DayView from './components/DayView/DayView'
import DashboardWidgets from './components/DashboardWidgets/DashboardWidgets'
import CalendarView from './components/CalendarView/CalendarView'
import AuthScreen from './components/AuthScreen/AuthScreen'
import { supabase } from './lib/supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentTab, setCurrentTab] = useState('write') // 'write' or 'calendar'

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
    if (!session?.user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
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
  }, [session]);

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
                color: '#3b82f6',
                letterSpacing: '-0.03em',
                margin: 0
              }}>
                ZeroLog ✨
              </h1>
              
              {!selectedDate && (
                <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '0.3rem', borderRadius: '12px' }}>
                  <button 
                    onClick={() => setCurrentTab('write')}
                    style={{
                      padding: '0.4rem 1.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: currentTab === 'write' ? '#ffffff' : 'transparent',
                      color: currentTab === 'write' ? '#1e293b' : '#64748b',
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
                      background: currentTab === 'calendar' ? '#ffffff' : 'transparent',
                      color: currentTab === 'calendar' ? '#1e293b' : '#64748b',
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
            <button 
              onClick={handleLogout}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                color: '#64748b',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 500,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              로그아웃
            </button>
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
            ) : currentTab === 'write' ? (
              <>
                {/* 1열: 질문지 (대화형 회고 폼) */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  <ChatReflection onAddLog={handleAddLog} user={session.user} />
                </div>
                {/* 2열: 대시보드 위젯 */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '1.5rem' }}>
                  <DashboardWidgets logs={logs} />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                <CalendarView logs={logs} onDateClick={setSelectedDate} />
              </div>
            )}
          </main>
        </>
      )}
    </Layout>
  )
}

export default App
