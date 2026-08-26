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

  // Render active page component
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
      default:
        return <Home setPage={setPage} setSelectedTaskId={setSelectedTaskId} setSelectedForumId={setSelectedForumId} />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar Header */}
      <Header />

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
