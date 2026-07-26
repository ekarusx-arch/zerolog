import { BookOpenText, CalendarDays, LogOut, Music2 } from 'lucide-react';
import BackgroundSelector from '../BackgroundSelector/BackgroundSelector';
import CalendarView from '../CalendarView/CalendarView';
import ChatReflection from '../ChatReflection/ChatReflection';
import DashboardWidgets from '../DashboardWidgets/DashboardWidgets';
import RetrospectiveTopics from '../DashboardWidgets/RetrospectiveTopics';
import DayView from '../DayView/DayView';
import SuiteBackLink from '../SuiteBackLink/SuiteBackLink';
import styles from './Workspace.module.css';

function WorkspaceTab({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.tabButton} ${active ? styles.activeTab : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

export default function Workspace({
  bgTheme,
  calendarViewMode,
  currentTab,
  errorMessage,
  isPro,
  loading,
  logs,
  onAddLog,
  onLogout,
  returnUrl,
  selectedDate,
  setBgTheme,
  setCalendarViewMode,
  setCurrentTab,
  setSelectedDate,
  suiteDate,
  user,
  accessToken,
}) {
  const selectedLog = selectedDate
    ? logs.find((log) => log.date.startsWith(selectedDate))
    : null;

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <SuiteBackLink href={returnUrl} />
          <div className={styles.titleCluster}>
            <div className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">Z</span>
              <h1>ZeroLog</h1>
              {isPro && <span className={styles.proBadge}>PRO</span>}
            </div>

            {!selectedDate && (
              <nav className={`${styles.tabs} ${styles.desktopTabs}`} aria-label="ZeroLog 보기 전환">
                <WorkspaceTab
                  active={currentTab === 'write'}
                  icon={BookOpenText}
                  onClick={() => setCurrentTab('write')}
                >
                  하루 회고
                </WorkspaceTab>
                <WorkspaceTab
                  active={currentTab === 'calendar'}
                  icon={CalendarDays}
                  onClick={() => setCurrentTab('calendar')}
                >
                  회고 모아보기
                </WorkspaceTab>
              </nav>
            )}
          </div>
        </div>

        <div className={styles.headerActions}>
          {suiteDate && !selectedDate && (
            <span className={styles.dateChip}>{suiteDate}</span>
          )}
          <BackgroundSelector currentTheme={bgTheme} onThemeChange={setBgTheme} />
          <button type="button" className={styles.logoutButton} onClick={onLogout}>
            <LogOut size={17} aria-hidden="true" />
            <span>로그아웃</span>
          </button>
        </div>
      </header>

      {!selectedDate && (
        <nav className={`${styles.tabs} ${styles.mobileTabs}`} aria-label="ZeroLog 보기 전환">
          <WorkspaceTab
            active={currentTab === 'write'}
            icon={BookOpenText}
            onClick={() => setCurrentTab('write')}
          >
            하루 회고
          </WorkspaceTab>
          <WorkspaceTab
            active={currentTab === 'calendar'}
            icon={CalendarDays}
            onClick={() => setCurrentTab('calendar')}
          >
            회고 모아보기
          </WorkspaceTab>
        </nav>
      )}

      {suiteDate && !selectedDate && (
        <div className={styles.mobileDateContext}>
          <CalendarDays size={15} aria-hidden="true" />
          <span>ZeroSlate {suiteDate} 회고</span>
        </div>
      )}

      <main className={styles.workspace}>
        {errorMessage && <div className={styles.loading} role="alert">{errorMessage}</div>}
        {loading && <div className={styles.loading}>기록을 불러오는 중...</div>}

        {!loading && selectedDate && (
          <div className={styles.dayView}>
              <DayView
              selectedDate={selectedDate}
              log={selectedLog}
              onBack={() => setSelectedDate(null)}
              onAddLog={onAddLog}
                user={user}
            />
          </div>
        )}

        {!loading && !selectedDate && currentTab === 'write' && (
          <div className={styles.writeGrid}>
            <div className={styles.primaryColumn}>
              <div className={styles.chatPanel}>
                <ChatReflection accessToken={accessToken} onAddLog={onAddLog} user={user} entryDate={suiteDate} />
              </div>
              <RetrospectiveTopics />
            </div>

            <div className={styles.secondaryColumn}>
              <section className={styles.playlist} aria-labelledby="playlist-title">
                <div className={styles.playlistHeader}>
                  <div className={styles.playlistTitle}>
                    <Music2 size={18} aria-hidden="true" />
                    <h2 id="playlist-title">하루끝플리</h2>
                  </div>
                  <span>음악과 함께 하루를 정리해보세요</span>
                </div>
                <iframe
                  src="https://www.youtube.com/embed/eHaxwrKR6to?loop=1&playlist=eHaxwrKR6to&playsinline=1&rel=0"
                  title="하루끝플리 플레이어"
                  frameBorder="0"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </section>
              <div className={styles.insightScroll}>
                <DashboardWidgets logs={logs} />
              </div>
            </div>
          </div>
        )}

        {!loading && !selectedDate && currentTab === 'calendar' && (
          <div className={styles.calendarPanel}>
            <CalendarView
              logs={logs}
              onDateClick={setSelectedDate}
              viewMode={calendarViewMode}
              setViewMode={setCalendarViewMode}
            />
          </div>
        )}
      </main>
    </div>
  );
}
