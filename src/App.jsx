import { useEffect, useState } from 'react';
import AuthScreen from './components/AuthScreen/AuthScreen';
import Layout from './components/Layout/Layout';
import SuiteBackLink from './components/SuiteBackLink/SuiteBackLink';
import Workspace from './components/Workspace/Workspace';
import { supabase } from './lib/supabaseClient';
import { consumeSuiteLogin, fetchZeroLogEntries, fetchZeroSlatePlan } from './lib/zeroSlateApi';

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

function buildSuiteReturnUrl(rawUrl) {
  const target = new URL(getSafeReturnUrl(rawUrl));
  target.searchParams.set('from', 'log');
  target.searchParams.set('suiteReturn', '1');
  return target.toString();
}

function getSuiteContext() {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date');

  return {
    suiteCode: params.get('suiteCode'),
    returnUrl: buildSuiteReturnUrl(params.get('returnUrl') || params.get('return')),
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
  const [planLoading, setPlanLoading] = useState(!isDevPreview);
  const [isPro, setIsPro] = useState(isDevPreview);
  const [errorMessage, setErrorMessage] = useState('');
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

    let active = true;
    let subscription;

    const initializeSession = async () => {
      if (suiteContext.suiteCode) {
        try {
          await consumeSuiteLogin({
            suiteCode: suiteContext.suiteCode,
            supabaseAuth: supabase.auth,
          });
        } catch (error) {
          console.warn('ZeroSlate Suite 자동 로그인에 실패했습니다:', error);
        }
      }

      const { data: { session: nextSession } } = await supabase.auth.getSession();
      if (active) setSession(nextSession);

      const authState = supabase.auth.onAuthStateChange((_event, nextSessionState) => {
        if (active) setSession(nextSessionState);
      });
      subscription = authState.data.subscription;
    };

    initializeSession();
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [suiteContext.suiteCode]);

  useEffect(() => {
    if (isDevPreview || !session?.access_token) {
      setPlanLoading(false);
      return;
    }

    let active = true;
    setPlanLoading(true);
    fetchZeroSlatePlan(session.access_token)
      .then((data) => {
        if (active) setIsPro(data?.plan === 'pro');
      })
      .catch((error) => {
        console.warn('ZeroSlate Pro 권한 확인에 실패했습니다:', error);
        if (active) setIsPro(false);
      })
      .finally(() => {
        if (active) setPlanLoading(false);
      });

    return () => { active = false; };
  }, [session?.access_token]);

  useEffect(() => {
    if (isDevPreview) return;
    if (!session?.user?.id) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await fetchZeroLogEntries(session.access_token);
        if (data) setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setErrorMessage(error.message || '회고 기록을 불러오지 못했습니다.');
      }
      setLoading(false);
    };

    fetchLogs();
  }, [session?.access_token, session?.user?.id]);

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
      ) : planLoading ? (
        <div className="closed-shell">
          <section className="closed-card" aria-live="polite">
            <span className="closed-badge">ZeroSlate Pro</span>
            <h1>Pro 권한을 확인하는 중입니다</h1>
            <p>ZeroLog가 ZeroSlate 계정의 구독 상태를 확인하고 있습니다.</p>
          </section>
        </div>
      ) : !isPro ? (
        <div className="closed-shell">
          <div className="auth-suite-link">
            <SuiteBackLink href={suiteContext.returnUrl} />
          </div>
          <section className="closed-card" aria-live="polite">
            <span className="closed-badge">Pro only</span>
            <h1>ZeroLog는 ZeroSlate Pro 전용입니다</h1>
            <p>ZeroSlate에서 Pro 권한이 확인되는 같은 계정으로 다시 열어주세요.</p>
            <a className="closed-return" href={suiteContext.returnUrl}>ZeroSlate로 돌아가기</a>
          </section>
        </div>
      ) : (
        <Workspace
          bgTheme={bgTheme}
          calendarViewMode={calendarViewMode}
          currentTab={currentTab}
          errorMessage={errorMessage}
          isPro={isPro}
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
          accessToken={session.access_token}
        />
      )}
    </Layout>
  );
}

export default App;
