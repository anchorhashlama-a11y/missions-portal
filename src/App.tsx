import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';

// Pages
import { Home } from './pages/Home';
import { MyTasks } from './pages/MyTasks';
import { TaskDetails } from './pages/TaskDetails';
import { TaskForm } from './pages/TaskForm';
import { Forums } from './pages/Forums';
import { ForumFeed } from './pages/ForumFeed';
import { Management } from './pages/Management';
import { TaskTracking } from './pages/TaskTracking';
import { SystemAdmin } from './pages/SystemAdmin';
import { Profile } from './pages/Profile';

// ─── Login Screen ────────────────────────────────────────────────────────────
const LoginScreen: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '24px',
      backgroundColor: 'var(--background)', color: 'var(--on-background)',
      direction: 'rtl', fontFamily: 'inherit'
    }}>
      <div style={{ fontSize: '48px' }}>⚓</div>
      <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>ANCHOR</h1>
      <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '16px' }}>
        פורטל משימות
      </p>
      <button
        onClick={loginWithGoogle}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 28px', borderRadius: '12px', border: 'none',
          backgroundColor: 'var(--primary)', color: 'var(--on-primary)',
          fontSize: '16px', fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
          <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
        התחבר עם Google
      </button>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { loading, currentUser } = useAuth();
  
  // Routing states
  const [page, setPage] = useState<string>('home');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedForumId, setSelectedForumId] = useState<string>('');

  if (loading) {
    return (
      <div style={loadingWrapperStyle}>
        <div style={spinnerStyle}></div>
        <div style={{ marginTop: '16px', fontWeight: 600 }}>טוען נתונים...</div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!currentUser) {
    return <LoginScreen />;
  }

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <Home 
            setPage={setPage} 
            setSelectedTaskId={setSelectedTaskId} 
            setSelectedForumId={setSelectedForumId} 
          />
        );
      case 'tasks':
        return (
          <MyTasks 
            setPage={setPage} 
            setSelectedTaskId={setSelectedTaskId} 
          />
        );
      case 'task-details':
        return (
          <TaskDetails 
            taskId={selectedTaskId} 
            setPage={setPage} 
            onEditTask={(id) => {
              setSelectedTaskId(id);
              setPage('edit-task');
            }}
          />
        );
      case 'create-task':
        return (
          <TaskForm 
            setPage={setPage} 
          />
        );
      case 'edit-task':
        return (
          <TaskForm 
            taskId={selectedTaskId}
            setPage={setPage} 
          />
        );
      case 'forums':
        return (
          <Forums 
            setPage={setPage} 
            setSelectedForumId={setSelectedForumId} 
          />
        );
      case 'forum-feed':
        return (
          <ForumFeed 
            forumId={selectedForumId} 
            setPage={setPage} 
            setSelectedTaskId={setSelectedTaskId}
            onCreateTask={() => setPage('create-task')}
          />
        );
      case 'management':
        return (
          <Management 
            setPage={setPage} 
            setSelectedTaskId={setSelectedTaskId}
            onCreateTask={() => setPage('create-task')}
            onEditTask={(id) => {
              setSelectedTaskId(id);
              setPage('edit-task');
            }}
          />
        );
      case 'task-tracking':
        return (
          <TaskTracking 
            taskId={selectedTaskId} 
            setPage={setPage} 
          />
        );
      case 'admin':
        return <SystemAdmin />;
      case 'profile':
        return <Profile setPage={setPage} />;
      default:
        return <Home setPage={setPage} setSelectedTaskId={setSelectedTaskId} setSelectedForumId={setSelectedForumId} />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar Header */}
      <Header setPage={setPage} />

      <div className="main-content">
        {/* Navigation Sidebar (Desktop only) */}
        <Sidebar currentPage={page} setPage={setPage} />

        {/* Navigation BottomNav (Mobile only) */}
        <BottomNav currentPage={page} setPage={setPage} />

        {/* Dynamic page contents */}
        <main className="page-wrapper">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

// Main App component wrapping Auth Context
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Styles for loading spinner
const loadingWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: 'var(--background)',
  color: 'var(--on-background)',
  direction: 'rtl'
};

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '4px solid var(--outline-variant)',
  borderTop: '4px solid var(--primary)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

// Inject CSS animation for spinner
const injectSpinnerKeyframes = () => {
  if (document.getElementById('spinner-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'spinner-keyframes';
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};
if (typeof window !== 'undefined') {
  injectSpinnerKeyframes();
}

export default App;
