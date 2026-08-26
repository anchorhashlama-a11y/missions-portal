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

interface BottomNavProps {
  currentPage: string;
  setPage: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setPage }) => {
  const { currentUser, activeRole } = useAuth();
  const [openTasksCount, setOpenTasksCount] = useState(0);

  // Fetch count of open tasks assigned to the user
  useEffect(() => {
    const fetchCount = async () => {
      if (!currentUser) return;
      try {
        const allTasks = await dbService.getTasks();
        const myTasks = backendService.getTasksForUser(currentUser.id, allTasks, [], []);
        const statuses = await dbService.getTaskStatuses();
        
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

  const canManageTasks = activeRole?.permissions.includes('canTrackTaskCompletion') || activeRole?.permissions.includes('canPublishTasks');
  
  const canAdminSystem = activeRole?.permissions.some(p => 
    p === 'canManageUsers' || p === 'canManageRoles' || p === 'canManageTags' || p === 'canCreateForums'
  );

  const navItems = [
    { id: 'home', label: 'בית', icon: <Home size={20} /> },
    { 
      id: 'tasks', 
      label: 'משימות', 
      icon: <CheckSquare size={20} />,
      badge: openTasksCount > 0 ? openTasksCount : undefined 
    },
    { id: 'forums', label: 'פורומים', icon: <MessageSquare size={20} /> },
  ];

  if (canManageTasks) {
    navItems.push({ id: 'management', label: 'ניהול', icon: <BarChart2 size={20} /> });
  }

  if (canAdminSystem && navItems.length < 5) {
    navItems.push({ id: 'admin', label: 'ניהול מערכת', icon: <SettingsIcon size={20} /> });
  }

  return (
    <nav className="bottom-nav">
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
            <div style={iconWrapperStyle}>
              {item.icon}
              {item.badge !== undefined && (
                <span style={badgeStyle}>{item.badge}</span>
              )}
            </div>
            <span style={labelStyle}>{item.label}</span>
            {isActive && <div style={dotIndicatorStyle} />}
          </button>
        );
      })}
    </nav>
  );
};



const itemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  height: '100%',
  border: 'none',
  background: 'none',
  color: 'var(--on-surface-variant)',
  cursor: 'pointer',
  position: 'relative',
  padding: '4px 0',
  minHeight: '48px', /* Touch target */
  transition: 'color 0.2s ease'
};

const activeItemStyle: React.CSSProperties = {
  ...itemStyle,
  color: 'var(--primary)',
  fontWeight: 700
};

const iconWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '2px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem'
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-6px',
  left: '-10px',
  backgroundColor: 'var(--status-urgent)',
  color: 'white',
  fontSize: '0.65rem',
  fontWeight: 700,
  height: '16px',
  minWidth: '16px',
  borderRadius: 'var(--rounded-full)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const dotIndicatorStyle: React.CSSProperties = {
  width: '4px',
  height: '4px',
  backgroundColor: 'var(--primary)',
  borderRadius: 'var(--rounded-full)',
  position: 'absolute',
  bottom: '4px'
};
