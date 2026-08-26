import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import type { Task, TaskStatus, User, Tag, Role } from '../types';
import { 
  ArrowRight, 
  Calendar, 
  User as UserIcon, 
  Tag as TagIcon, 
  Link as LinkIcon, 
  FileText, 
  Check, 
  Edit, 
  History,
  Info
} from 'lucide-react';

interface TaskDetailsProps {
  taskId: string;
  setPage: (page: string) => void;
  onEditTask: (id: string) => void;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId, setPage, onEditTask }) => {
  const { currentUser } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [publisher, setPublisher] = useState<User | null>(null);
  const [publisherRole, setPublisherRole] = useState<Role | null>(null);
  const [targetTags, setTargetTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const t = await dbService.getTask(taskId);
        if (!t) return;
        setTask(t);

        // Fetch publisher
        const users = await dbService.getUsers();
        const pub = users.find(u => u.id === t.publisherId) || null;
        setPublisher(pub);

        // Fetch publisher role
        const roles = await dbService.getRoles();
        const pRole = roles.find(r => r.id === t.publisherRoleId) || null;
        setPublisherRole(pRole);

        // Fetch target tags
        const tags = await dbService.getTags();
        const tTags = tags.filter(tag => t.targetTagIds.includes(tag.id));
        setTargetTags(tTags);

        // Fetch user status
        if (currentUser) {
          const s = await dbService.getTaskStatus(taskId, currentUser.id);
          setStatus(s);

          // Mark as viewed on entry if not already set or version is older
          if (!s || !s.viewedAt || s.lastSeenVersion < t.version) {
            await dbService.saveTaskStatus(taskId, currentUser.id, {
              viewedAt: new Date().toISOString(),
              lastSeenVersion: t.version
            });
            const updatedStatus = await dbService.getTaskStatus(taskId, currentUser.id);
            setStatus(updatedStatus);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [taskId, currentUser]);

  if (loading) {
    return <div style={loadingStyle}>טוען פרטי משימה...</div>;
  }

  if (!task) {
    return (
      <div style={errorStyle}>
        <h3>משימה לא נמצאה</h3>
        <button onClick={() => setPage('tasks')} className="btn btn-primary">
          חזור לרשימת המשימות
        </button>
      </div>
    );
  }

  const isCompleted = !!(status && status.completedAt);
  const isPublisher = currentUser?.id === task.publisherId;

  const handleToggleComplete = async () => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    
    const updatedStatus = {
      completedAt: isCompleted ? null : now,
      viewedAt: status?.viewedAt || now,
      lastSeenVersion: task.version
    };

    await dbService.saveTaskStatus(task.id, currentUser.id, updatedStatus);
    const s = await dbService.getTaskStatus(task.id, currentUser.id);
    setStatus(s);
  };

  // Date formatting helpers
  const createdDate = new Date(task.createdAt).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const dueDate = new Date(task.dueDate).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fade-in">
      {/* Top back button row */}
      <div style={topRowStyle}>
        <button onClick={() => setPage('tasks')} style={backBtnStyle}>
          <ArrowRight size={18} />
          <span>חזור למשימות שלי</span>
        </button>

        {isPublisher && (
          <button onClick={() => onEditTask(task.id)} className="btn btn-secondary" style={editBtnStyle}>
            <Edit size={16} />
            <span>ערוך משימה</span>
          </button>
        )}
      </div>

      <div className="details-grid">
        {/* Main Details Panel */}
        <div className="details-main">
          <div style={headerCardStyle}>
            <h1 style={titleStyle}>{task.title}</h1>
            <p style={descStyle}>{task.description}</p>
            
            {task.link && (
              <a 
                href={task.link} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-primary" 
                style={actionLinkBtnStyle}
              >
                <LinkIcon size={18} />
                <span>{task.linkText?.trim() || 'פתח קישור לביצוע המשימה'}</span>
              </a>
            )}
          </div>

          {/* Attachments Section */}
          {task.documents && task.documents.length > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={sectionTitleStyle}>
                <FileText size={18} style={{ marginLeft: '8px' }} />
                מסמכים מצורפים
              </h3>
              <div style={docListStyle}>
                {task.documents.map((doc, idx) => (
                  <a key={idx} href={doc.url} target="_blank" rel="noreferrer" style={docItemStyle}>
                    <FileText size={16} />
                    <span>{doc.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Version Logs Section */}
          {task.version > 1 && (
            <div className="card">
              <h3 style={sectionTitleStyle}>
                <History size={18} style={{ marginLeft: '8px' }} />
                היסטוריית עדכונים
              </h3>
              <div style={versionInfoStyle}>
                <Info size={16} color="var(--primary)" />
                <span>
                  משימה זו עודכנה בעבר. גרסה נוכחית: <b>{task.version}</b>. עודכן לאחרונה ב-
                  {new Date(task.updatedAt).toLocaleDateString('he-IL', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div className="details-sidebar">
          {/* Action Box */}
          <div className="card" style={actionBoxStyle}>
            <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>סטטוס ביצוע</h3>
            
            <button 
              onClick={handleToggleComplete} 
              style={isCompleted ? completedStateBtnStyle : pendingStateBtnStyle}
            >
              <Check size={20} />
              <span>{isCompleted ? "בוצע בהצלחה" : "סמן כבוצע"}</span>
            </button>

            {isCompleted && status?.completedAt && (
              <div style={completedTimeStyle}>
                הושלם ב: {new Date(status.completedAt).toLocaleDateString('he-IL', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* Info Details */}
          <div className="card" style={infoBoxStyle}>
            <h3 style={{ marginBottom: '16px' }}>פרטי משימה</h3>
            
            <div style={infoItemStyle}>
              <UserIcon size={16} style={infoIconStyle} />
              <div>
                <div style={infoLabelStyle}>מפרסם:</div>
                <div style={infoValStyle}>
                  {publisher?.name || 'סגל'} ({publisherRole?.name || 'מנהל'})
                </div>
              </div>
            </div>

            <div style={infoItemStyle}>
              <Calendar size={16} style={infoIconStyle} />
              <div>
                <div style={infoLabelStyle}>תאריך פרסום:</div>
                <div style={infoValStyle}>{createdDate}</div>
              </div>
            </div>

            <div style={infoItemStyle}>
              <Calendar size={16} style={infoIconStyle} />
              <div>
                <div style={infoLabelStyle}>תאריך יעד אחרון:</div>
                <div style={{ ...infoValStyle, fontWeight: 700, color: 'var(--status-urgent)' }}>{dueDate}</div>
              </div>
            </div>

            <div style={infoItemStyle}>
              <TagIcon size={16} style={infoIconStyle} />
              <div>
                <div style={infoLabelStyle}>קהל יעד מוגדר:</div>
                <div style={tagsContainerStyle}>
                  {targetTags.map(tag => (
                    <span 
                      key={tag.id} 
                      className={`badge badge-${tag.category}`}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {task.targetUserIds.length > 0 && (
                    <span className="badge badge-special">
                      {task.targetUserIds.length} משתמשים שנבחרו ידנית
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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

const errorStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: 'var(--on-surface-variant)'
};

const topRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
};

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'none',
  border: 'none',
  color: 'var(--primary)',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 700
};

const editBtnStyle: React.CSSProperties = {
  minHeight: '36px',
  padding: '6px 16px',
  fontSize: '0.85rem'
};



const headerCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-xl)',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: 'var(--shadow-card)'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 800,
  color: 'var(--primary)',
  marginBottom: '16px'
};

const descStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: 'var(--on-surface-variant)',
  whiteSpace: 'pre-line',
  marginBottom: '24px'
};

const actionLinkBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  textDecoration: 'none'
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
  fontSize: '1.1rem',
  fontWeight: 700,
  borderBottom: '1px solid var(--surface-container-high)',
  paddingBottom: '8px'
};

const docListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const docItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--on-surface-variant)',
  backgroundColor: 'var(--surface-container-low)',
  padding: '12px 16px',
  borderRadius: 'var(--rounded-md)',
  fontSize: '0.9rem',
  border: '1px solid var(--outline-variant)',
  transition: 'background-color 0.2s ease'
};

const versionInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: 'rgba(0, 60, 144, 0.05)',
  padding: '12px 16px',
  borderRadius: 'var(--rounded-md)',
  fontSize: '0.85rem',
  color: 'var(--on-surface-variant)'
};

const actionBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch'
};

const stateBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px',
  borderRadius: 'var(--rounded-default)',
  border: 'none',
  fontSize: '1.05rem',
  fontWeight: 700,
  cursor: 'pointer',
  minHeight: '48px',
  transition: 'transform 0.1s ease, box-shadow 0.2s ease'
};

const pendingStateBtnStyle: React.CSSProperties = {
  ...stateBtnStyle,
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)'
};

const completedStateBtnStyle: React.CSSProperties = {
  ...stateBtnStyle,
  backgroundColor: 'var(--status-success)',
  color: 'white'
};

const completedTimeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--outline)',
  textAlign: 'center',
  marginTop: '8px',
  fontWeight: 600
};

const infoBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  fontSize: '0.88rem'
};

const infoIconStyle: React.CSSProperties = {
  color: 'var(--outline)',
  marginTop: '3px'
};

const infoLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--on-surface-variant)'
};

const infoValStyle: React.CSSProperties = {
  color: 'var(--on-surface)',
  marginTop: '2px'
};

const tagsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '4px'
};
