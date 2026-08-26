import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { backendService } from '../services/backend';
import { 
  Home, 
  CheckSquare, 
  MessageSquare, 
  BarChart2, 
  Settings as SettingsIcon 
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setPage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage }) => {
  const { currentUser, activeRole, userTags } = useAuth();
  const [openTasksCount, setOpenTasksCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      if (!currentUser) return;
      try {
        const [allTasks, allUsers, allUserTags, statuses] = await Promise.all([
          dbService.getTasks(),
          dbService.getUsers(),
          dbService.getUserTags(),
          dbService.getTaskStatuses()
        ]);
        const myTasks = backendService.getTasksForUser(currentUser.id, allTasks, allUsers, allUserTags);
        
        let count = 0;
        for (const t of myTasks) {
          const status = statuses.find(s => s.taskId === t.id && s.userId === currentUser.id);
          if (!status || !status.completedAt) {
            count++;
          }
        }
        setOpenTasksCount(count);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCount();
  }, [currentUser, activeRole]);

  if (!currentUser) return null;

  // Determine visibility of tabs based on active role permissions
  const canManageTasks = activeRole?.permissions.includes('canTrackTaskCompletion') || activeRole?.permissions.includes('canPublishTasks');
  
  const canAdminSystem = activeRole?.permissions.some(p => 
    p === 'canManageUsers' || p === 'canManageRoles' || p === 'canManageTags' || p === 'canCreateForums'
  );

  const navItems = [
    { id: 'home', label: 'דף הבית', icon: <Home size={20} /> },
    { 
      id: 'tasks', 
      label: 'המשימות שלי', 
      icon: <CheckSquare size={20} />,
      badge: openTasksCount > 0 ? openTasksCount : undefined 
    },
    { id: 'forums', label: 'פורומים', icon: <MessageSquare size={20} /> },
  ];

  if (canManageTasks) {
    navItems.push({ id: 'management', label: 'לוח ניהול ומעקב', icon: <BarChart2 size={20} /> });
  }

  if (canAdminSystem) {
    navItems.push({ id: 'admin', label: 'ניהול מערכת', icon: <SettingsIcon size={20} /> });
  }

  return (
    <aside className="sidebar">
      <nav style={navStyle}>
        {navItems.map(item => {
          const isActive = currentPage === item.id || 
            (item.id === 'tasks' && currentPage === 'task-details') ||
            (item.id === 'management' && (currentPage === 'task-tracking' || currentPage === 'create-task' || currentPage === 'edit-task')) ||
            (item.id === 'forums' && currentPage === 'forum-feed');

          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={isActive ? activeItemStyle : itemStyle}
            >
              <span style={iconStyle}>{item.icon}</span>
              <span style={labelStyle}>{item.label}</span>
              {item.badge !== undefined && (
                <span style={badgeStyle}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={footerStyle}>
        <div style={versionStyle}>גרסה 2.1.0</div>
        <div style={copyrightStyle}>Enterprise Grade</div>
      </div>
    </aside>
  );
};


const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--rounded-md)',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'var(--on-surface-variant)',
  cursor: 'pointer',
  textAlign: 'right',
  transition: 'background-color 0.2s ease, color 0.2s ease',
  minHeight: '48px'
};

const activeItemStyle: React.CSSProperties = {
  ...itemStyle,
  backgroundColor: 'var(--primary-container)',
  color: 'var(--on-primary-container)',
  fontWeight: 700
};

const iconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginLeft: '12px',
  flexShrink: 0
};

const labelStyle: React.CSSProperties = {
  flex: 1,
  fontSize: '0.95rem'
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: 'var(--status-urgent)',
  color: 'white',
  fontSize: '0.75rem',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 'var(--rounded-full)',
  minWidth: '20px',
  textAlign: 'center'
};

const footerStyle: React.CSSProperties = {
  paddingTop: '16px',
  borderTop: '1px solid var(--outline-variant)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  paddingRight: '8px'
};

const versionStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--outline)',
  fontWeight: 600
};

const copyrightStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--outline)',
  opacity: 0.8
};
