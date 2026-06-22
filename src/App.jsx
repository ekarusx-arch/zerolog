import { useEffect, useState } from 'react';
import AuthScreen from './components/AuthScreen/AuthScreen';
import Layout from './components/Layout/Layout';
import SuiteBackLink from './components/SuiteBackLink/SuiteBackLink';
import Workspace from './components/Workspace/Workspace';
import { supabase } from './lib/supabaseClient';

const ZERO_SLATE_URL = 'https://zeroslate.kr';
const isDevPreview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('preview') === 'mobile';

function getSafeReturnUrl(rawUrl) {
  if (!rawUrl) return ZERO_SLATE_URL;

  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const isAllowedProtocol = parsed.protocol === 'https:' || parsed.protocol === 'http:';
    const isAllowedHost = parsed.hostname === 'localhost'
      || parsed.hostname === '127.0.0.1'
      || parsed.hostname.endsWith('zeroslate.kr');

    if (isAllowedProtocol && isAllowedHost) return parsed.toString();
  } catch (error) {
    console.warn('ZeroSlate return URL parsing failed:', error);
  }

  return ZERO_SLATE_URL;
}

function getSuiteContext() {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date');

  return {
    returnUrl: getSafeReturnUrl(params.get('returnUrl') || params.get('return')),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : null,
  };
}

function getPreviewLogs() {
  const today = new Date();
  const createLog = (daysAgo, mood, q1, q2, q3) => {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    return { id: `preview-${daysAgo}`, date: date.toISOString(), mood, q1, q2, q3 };
  };

  return [
    createLog(0, 'good', '따뜻한 커피와 차분한 아침', '중요한 일을 먼저 끝냈다.', '완벽하게 하려는 마음'),
    createLog(1, 'great', '오랜만에 반가운 사람과 나눈 대화', '잠깐 멈추면 답이 더 잘 보였다.', '이미 지나간 걱정'),
    createLog(3, 'okay', '산책하며 본 저녁 하늘', '일정을 조금 넉넉하게 잡자.', '내일의 일까지 미리 걱정하기'),
    createLog(6, 'good', '집중해서 읽은 책 한 장', '작은 진전도 기록할 가치가 있다.', '비교하는 습관'),
  ];
}

function App() {
  const [session, setSession] = useState(() => (
    isDevPreview ? { user: { id: 'preview-user' } } : null
  ));
  const [logs, setLogs] = useState(() => (isDevPreview ? getPreviewLogs() : []));
  const [loading, setLoading] = useState(!isDevPreview);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentTab, setCurrentTab] = useState('write');
  const [calendarViewMode, setCalendarViewMode] = useState('monthly');
  const [suiteContext] = useState(getSuiteContext);
  const [bgTheme, setBgTheme] = useState(() => {
    const saved = localStorage.getItem('zerolog_bg_theme');
    if (saved === 'default' || saved === 'minimal') return 'night';
    return saved || 'night';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', bgTheme);
    localStorage.setItem('zerolog_bg_theme', bgTheme);
  }, [bgTheme]);

  useEffect(() => {
    if (isDevPreview) return undefined;

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDevPreview) return;
    if (!session?.user?.id) {
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

      if (!error && data) setLogs(data);
      else if (error) console.error('Error fetching logs:', error);
      setLoading(false);
    };

    fetchLogs();
  }, [session?.user?.id]);

  useEffect(() => {
    const latestMood = logs[0]?.mood;
    const moodColors = {
      great: 'rgba(16, 185, 129, 0.15)',
      good: 'rgba(59, 130, 246, 0.15)',
      okay: 'rgba(245, 158, 11, 0.15)',
      bad: 'rgba(239, 68, 68, 0.15)',
      awful: 'rgba(139, 92, 246, 0.15)',
    };
    document.body.style.setProperty('--aura-color', moodColors[latestMood] || 'rgba(30, 41, 59, 0.5)');
  }, [logs]);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const handleMouseMove = (event) => {
      const x = Math.round((event.clientX / window.innerWidth) * 100);
      const y = Math.round((event.clientY / window.innerHeight) * 100);
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAddLog = (newLog) => setLogs((currentLogs) => [newLog, ...currentLogs]);
  const handleLogout = async () => {
    if (!isDevPreview) await supabase.auth.signOut();
  };

  return (
    <Layout>
      {!session ? (
        <div className="auth-shell">
          <div className="auth-suite-link">
            <SuiteBackLink href={suiteContext.returnUrl} />
          </div>
          <AuthScreen />
        </div>
      ) : (
        <Workspace
          bgTheme={bgTheme}
          calendarViewMode={calendarViewMode}
          currentTab={currentTab}
          loading={loading}
          logs={logs}
          onAddLog={handleAddLog}
          onLogout={handleLogout}
          returnUrl={suiteContext.returnUrl}
          selectedDate={selectedDate}
          setBgTheme={setBgTheme}
          setCalendarViewMode={setCalendarViewMode}
          setCurrentTab={setCurrentTab}
          setSelectedDate={setSelectedDate}
          suiteDate={suiteContext.date}
          user={session.user}
        />
      )}
    </Layout>
  );
}

export default App;
