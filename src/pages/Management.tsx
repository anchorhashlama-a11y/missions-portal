import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { backendService } from '../services/backend';
import type { Task, TaskStatus, User, Tag, UserTag } from '../types';
import { Plus, BarChart2, Edit, Calendar, UserCheck, Play } from 'lucide-react';

interface ManagementProps {
  setPage: (page: string) => void;
  setSelectedTaskId: (id: string) => void;
  onCreateTask: () => void;
  onEditTask: (id: string) => void;
}

export const Management: React.FC<ManagementProps> = ({ 
  setPage, 
  setSelectedTaskId,
  onCreateTask,
  onEditTask
}) => {
  const { currentUser, activeRole } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !activeRole) return;
      try {
        setLoading(true);
        // Load all database entities
        const allTasks = await dbService.getTasks();
        const allUsers = await dbService.getUsers();
        const allUserTags = await dbService.getUserTags();
        const allStatuses = await dbService.getTaskStatuses();
        const allRoles = await dbService.getRoles();

        setUsers(allUsers);
        setUserTags(allUserTags);
        setStatuses(allStatuses);

        // Fetch user active roles
        const allUserRoles = await dbService.getUserRoles();
        const myRoleIds = allUserRoles.filter(ur => ur.userId === currentUser.id).map(ur => ur.roleId);
        const myRoles = allRoles.filter(r => myRoleIds.includes(r.id));

        // Get tasks that overlap with the active manager's scope
        const managementTasks = backendService.getManagementTasks(
          allTasks,
          myRoles,
          allUsers,
          allUserTags
        );
        
        // Sort by created date descending
        managementTasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setTasks(managementTasks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, activeRole]);

  if (loading) {
    return <div style={loadingStyle}>טוען לוח ניהול...</div>;
  }

  const canPublish = activeRole?.permissions.includes('canPublishTasks');

  return (
    <div className="fade-in">
      <div style={titleHeaderStyle}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>לוח ניהול ומעקב</h1>
          <p className="text-muted">עקוב אחר ביצועי המשימות של המשתמשים תחת תחום אחריותך.</p>
        </div>
        {canPublish && (
          <button onClick={onCreateTask} className="btn btn-primary">
            <Plus size={18} />
            <span>פרסם משימה חדשה</span>
          </button>
        )}
      </div>

      {/* Role scope warning banner */}
      <div style={scopeBannerStyle}>
        <BarChart2 size={18} style={{ marginLeft: '10px' }} />
        <span>
          מציג משימות עבור תפקיד: <b>{activeRole?.name}</b>. נתוני ההתקדמות המופיעים מטה מחושבים <b>אך ורק</b> עבור משתמשים המשויכים לתחום האחריות שלך.
        </span>
      </div>

      {/* Tasks Progress List */}
      <div style={tasksGridStyle}>
        {tasks.length === 0 ? (
          <div style={emptyCardStyle}>
            <UserCheck size={36} color="var(--outline)" />
            <h3>אין משימות למעקב</h3>
            <p className="text-muted">אין כרגע משימות פעילות שנשלחו למשתמשים בטווח האחריות שלך.</p>
          </div>
        ) : (
          tasks.map(task => {
            if (!activeRole) return null;
            
            // Calculate progress strictly filtered to this role's scope
            const progress = backendService.getTaskProgressForRole(
              task,
              activeRole,
              users,
              userTags,
              statuses
            );

            const isPublisher = currentUser?.id === task.publisherId;

            // Formatted due date
            const dueDate = new Date(task.dueDate).toLocaleDateString('he-IL', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            });

            return (
              <div key={task.id} className="card" style={taskCardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <h3 style={taskTitleStyle}>{task.title}</h3>
                    <div style={publisherStyle}>
                      פורסם על ידי: <b>{task.publisherId === 'user_meir' ? 'מאיר' : task.publisherId === 'user_roni' ? 'רוני' : task.publisherId === 'user_alon' ? 'אלון' : 'סגל'}</b>
                    </div>
                  </div>
                  <div style={dateBadgeStyle}>
                    <Calendar size={14} />
                    <span>יעד: {dueDate}</span>
                  </div>
                </div>

                {/* Progress bar info */}
                <div style={progressSectionStyle}>
                  <div style={progressLabelsStyle}>
                    <span style={progressPercentStyle}>{progress.progressPercent}% הושלם</span>
                    <span style={progressFractionStyle}>
                      בוצע על ידי: {progress.completedCount} מתוך {progress.totalRecipients}
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progress.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={cardActionsStyle}>
                  <button 
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setPage('task-tracking');
                    }}
                    className="btn btn-primary"
                    style={trackBtnStyle}
                  >
                    <Play size={14} style={{ transform: 'rotate(180deg)' }} />
                    <span>צפייה בדוח ביצוע</span>
                  </button>

                  {isPublisher && (
                    <button 
                      onClick={() => onEditTask(task.id)}
                      className="btn btn-secondary"
                      style={editBtnStyle}
                    >
                      <Edit size={14} />
                      <span>ערוך משימה</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Styles
const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: 'var(--outline)'
};

const titleHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '24px'
};

const scopeBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 60, 144, 0.05)',
  border: '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-md)',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.88rem',
  color: 'var(--on-surface-variant)',
  marginBottom: '24px'
};

const tasksGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const taskCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '24px'
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '16px',
  flexWrap: 'wrap'
};

const taskTitleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 800,
  color: 'var(--primary)',
  margin: 0
};

const publisherStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--outline)',
  marginTop: '4px'
};

const dateBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.8rem',
  backgroundColor: 'var(--surface-container-high)',
  padding: '6px 12px',
  borderRadius: 'var(--rounded-full)',
  fontWeight: 600,
  color: 'var(--on-surface-variant)'
};

const progressSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  backgroundColor: 'var(--surface-container-low)',
  padding: '16px',
  borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--outline-variant)'
};

const progressLabelsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.85rem'
};

const progressPercentStyle: React.CSSProperties = {
  fontWeight: 800,
  color: 'var(--primary)'
};

const progressFractionStyle: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--on-surface-variant)'
};

const cardActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  marginTop: '4px'
};

const trackBtnStyle: React.CSSProperties = {
  minHeight: '36px',
  padding: '6px 16px',
  fontSize: '0.85rem'
};

const editBtnStyle: React.CSSProperties = {
  minHeight: '36px',
  padding: '6px 16px',
  fontSize: '0.85rem'
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
  gap: '12px',
  color: 'var(--on-surface-variant)',
  textAlign: 'center'
};
