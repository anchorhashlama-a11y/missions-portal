import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { backendService } from '../services/backend';
import type { Task, TaskStatus, Tag } from '../types';
import { TaskCard } from '../components/TaskCard';
import { Search, Filter, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';

interface MyTasksProps {
  setPage: (page: string) => void;
  setSelectedTaskId: (id: string) => void;
}

type FilterType = 'all' | 'open' | 'completed' | 'overdue';

export const MyTasks: React.FC<MyTasksProps> = ({ setPage, setSelectedTaskId }) => {
  const { currentUser, userTags } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTagId, setSelectedTagId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const [allTasks, allUsers, allUserTags] = await Promise.all([
          dbService.getTasks(),
          dbService.getUsers(),
          dbService.getUserTags()
        ]);
        const userTasks = backendService.getTasksForUser(currentUser.id, allTasks, allUsers, allUserTags);
        setTasks(userTasks);

        const allStatuses = await dbService.getTaskStatuses();
        setStatuses(allStatuses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (loading) {
    return <div style={loadingStyle}>טוען משימות...</div>;
  }

  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!currentUser) return;

    const status = statuses.find(s => s.taskId === task.id && s.userId === currentUser.id);
    const isCompleted = !!(status && status.completedAt);
    
    const now = new Date().toISOString();
    const updatedStatus = {
      completedAt: isCompleted ? null : now,
      viewedAt: status?.viewedAt || now,
      lastSeenVersion: task.version
    };

    await dbService.saveTaskStatus(task.id, currentUser.id, updatedStatus);
    
    const allStatuses = await dbService.getTaskStatuses();
    setStatuses(allStatuses);
  };

  const handleTaskClick = async (task: Task) => {
    if (!currentUser) return;
    
    // Mark viewed if not already
    const status = statuses.find(s => s.taskId === task.id && s.userId === currentUser.id);
    if (!status || !status.viewedAt || status.lastSeenVersion < task.version) {
      await dbService.saveTaskStatus(task.id, currentUser.id, {
        viewedAt: new Date().toISOString(),
        lastSeenVersion: task.version
      });
    }

    setSelectedTaskId(task.id);
    setPage('task-details');
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter(task => {
    const status = statuses.find(s => s.taskId === task.id && s.userId === currentUser?.id);
    const isCompleted = !!(status && status.completedAt);
    const isOverdue = new Date(task.dueDate) < new Date() && !isCompleted;

    // Search query matching
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filter === 'open' && isCompleted) return false;
    if (filter === 'completed' && !isCompleted) return false;
    if (filter === 'overdue' && !isOverdue) return false;

    // Tag filter
    if (selectedTagId !== 'all') {
      const matchesTag = task.targetTagIds?.includes(selectedTagId);
      if (!matchesTag) return false;
    }

    return true;
  });

  return (
    <div className="fade-in">
      <div style={titleRowStyle}>
        <h1>המשימות שלי</h1>
        <div style={taskCountSummaryStyle}>
          {filteredTasks.length} משימות מסוננות
        </div>
      </div>

      {/* Filter and Search controls */}
      <div style={controlsCardStyle}>
        <div style={searchWrapperStyle}>
          <Search size={18} style={searchIconStyle} />
          <input
            type="text"
            placeholder="חיפוש משימה לפי כותרת או תיאור..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={filtersRowStyle}>
          {/* Status Filters */}
          <div style={filterGroupStyle}>
            <span style={filterLabelStyle}>סטטוס:</span>
            <div style={btnGroupStyle}>
              <button 
                onClick={() => setFilter('all')} 
                style={filter === 'all' ? activeFilterBtnStyle : filterBtnStyle}
              >
                הכל
              </button>
              <button 
                onClick={() => setFilter('open')} 
                style={filter === 'open' ? activeFilterBtnStyle : filterBtnStyle}
              >
                פתוחות
              </button>
              <button 
                onClick={() => setFilter('completed')} 
                style={filter === 'completed' ? activeFilterBtnStyle : filterBtnStyle}
              >
                בוצעו
              </button>
              <button 
                onClick={() => setFilter('overdue')} 
                style={filter === 'overdue' ? activeFilterBtnStyle : filterBtnStyle}
              >
                באיחור
              </button>
            </div>
          </div>

          {/* Group Tag Filters */}
          {userTags.length > 0 && (
            <div style={filterGroupStyle}>
              <span style={filterLabelStyle}>שיוך / קבוצה:</span>
              <select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                style={selectFilterStyle}
              >
                <option value="all">כל הקבוצות</option>
                {userTags.map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div style={tasksListStyle}>
        {filteredTasks.length === 0 ? (
          <div style={emptyCardStyle}>
            <CheckCircle size={40} color="var(--outline)" style={{ marginBottom: '12px' }} />
            <h3>לא נמצאו משימות מתאימות</h3>
            <p className="text-muted">נסה לשנות את מסנני הסטטוס או החיפוש.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const status = statuses.find(s => s.taskId === task.id && s.userId === currentUser?.id) || null;
            return (
              <TaskCard
                key={task.id}
                task={task}
                status={status}
                onToggleComplete={(e) => handleToggleComplete(e, task)}
                onClick={() => handleTaskClick(task)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

// Inline styling
const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: 'var(--outline)'
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px'
};

const taskCountSummaryStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  backgroundColor: 'var(--surface-container-high)',
  padding: '6px 12px',
  borderRadius: 'var(--rounded-full)',
  color: 'var(--on-surface-variant)'
};

const controlsCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-lg)',
  padding: '16px',
  marginBottom: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  boxShadow: 'var(--shadow-card)'
};

const searchWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%'
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: '16px',
  transform: 'translateY(-50%)',
  color: 'var(--outline)',
  pointerEvents: 'none'
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 48px 12px 16px',
  borderRadius: 'var(--rounded-default)',
  border: '1px solid var(--outline-variant)',
  backgroundColor: 'var(--background)',
  color: 'var(--on-background)',
  outline: 'none',
  fontSize: '0.95rem'
};

const filtersRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px'
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const filterLabelStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 700,
  color: 'var(--on-surface-variant)'
};

const btnGroupStyle: React.CSSProperties = {
  display: 'flex',
  border: '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-default)',
  overflow: 'hidden',
  backgroundColor: 'var(--surface-container)'
};

const filterBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  background: 'none',
  color: 'var(--on-surface)',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, color 0.2s ease',
  borderLeft: '1px solid var(--outline-variant)'
};

const activeFilterBtnStyle: React.CSSProperties = {
  ...filterBtnStyle,
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)',
  borderLeft: '1px solid var(--primary)'
};

const selectFilterStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  borderRadius: 'var(--rounded-default)',
  border: '1px solid var(--outline-variant)',
  backgroundColor: 'var(--surface)',
  color: 'var(--on-surface)',
  outline: 'none',
  cursor: 'pointer'
};

const tasksListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const emptyCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  borderRadius: 'var(--rounded-xl)',
  border: '1px dotted var(--outline)',
  padding: '60px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)',
  textAlign: 'center'
};
