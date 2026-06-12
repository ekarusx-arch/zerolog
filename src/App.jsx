import { useState, useEffect } from 'react'
import Layout from './components/Layout/Layout'
import ChatReflection from './components/ChatReflection/ChatReflection'
import DotCalendar from './components/DotCalendar/DotCalendar'
import MonthlyCalendar from './components/MonthlyCalendar/MonthlyCalendar'
import DayView from './components/DayView/DayView'
import AuthScreen from './components/AuthScreen/AuthScreen'
import { supabase } from './lib/supabaseClient'

function App() {
  const [session, setSession] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

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
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 600, 
              background: 'linear-gradient(135deg, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em'
            }}>
              ZeroLog ✨
            </h1>
            <button 
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                color: 'var(--color-text-secondary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              로그아웃
            </button>
          </header>
          
          <main style={{ 
            display: 'grid', 
            gridTemplateColumns: selectedDate ? 'minmax(400px, 800px)' : 'minmax(300px, 1fr) minmax(300px, 1fr)',
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
                  // Stay on DayView, which will now display the added log
                }}
                user={session.user}
              />
            ) : (
              <>
                {/* 1열: 질문지 (대화형 일기 쓰기 폼) */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  <ChatReflection onAddLog={handleAddLog} user={session.user} />
                </div>
                {/* 2열: 달력 */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  <MonthlyCalendar logs={logs} onDateClick={setSelectedDate} />
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
