import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { backendService } from '../services/backend';
import type { Forum, ForumPost, User, Role, Task, TaskStatus } from '../types';
import { 
  ArrowRight, 
  Send, 
  Calendar, 
  FileText, 
  CheckCircle,
  Megaphone,
  User as UserIcon,
  Plus
} from 'lucide-react';

interface ForumFeedProps {
  forumId: string;
  setPage: (page: string) => void;
  setSelectedTaskId: (id: string) => void;
  onCreateTask: () => void;
}

export const ForumFeed: React.FC<ForumFeedProps> = ({ 
  forumId, 
  setPage, 
  setSelectedTaskId,
  onCreateTask
}) => {
  const { currentUser, activeRole } = useAuth();
  
  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus | null>>({});
  const [loading, setLoading] = useState(true);

  // New post composer state
  const [newPostText, setNewPostText] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load Forum
        const allForums = await dbService.getForums();
        const f = allForums.find(item => item.id === forumId) || null;
        setForum(f);

        if (!f) return;

        // Load Posts
        const forumPosts = await dbService.getForumPosts(forumId);
        setPosts(forumPosts);

        // Load referenced tasks
        const allTasks = await dbService.getTasks();
        const taskMap: Record<string, Task> = {};
        allTasks.forEach(t => {
          taskMap[t.id] = t;
        });
        setTasks(taskMap);

        // Load statuses of those tasks
        if (currentUser) {
          const statusesMap: Record<string, TaskStatus | null> = {};
          for (const post of forumPosts) {
            if (post.type === 'task' && post.taskId) {
              const status = await dbService.getTaskStatus(post.taskId, currentUser.id);
              statusesMap[post.taskId] = status;
            }
          }
          setTaskStatuses(statusesMap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [forumId, currentUser]);

  if (loading) {
    return <div style={loadingStyle}>טוען עדכוני פורום...</div>;
  }

  if (!forum) {
    return (
      <div style={errorStyle}>
        <h3>פורום לא נמצא</h3>
        <button onClick={() => setPage('forums')} className="btn btn-primary">
          חזור לפורומים
        </button>
      </div>
    );
  }

  // Check if active user is a Forum Manager (permissions and listed manager role)
  const isManager = activeRole && (
    forum.managerRoleIds.includes(activeRole.id) || 
    activeRole.permissions.includes('canManageForums')
  );

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeRole || !newPostText.trim()) return;

    try {
      setPublishing(true);
      
      await dbService.createForumPost({
        forumId: forum.id,
        publisherId: currentUser.id,
        publisherRoleId: activeRole.id,
        type: 'message',
        content: newPostText.trim(),
        taskId: null
      });

      setNewPostText('');
      
      // Reload posts
      const forumPosts = await dbService.getForumPosts(forumId);
      setPosts(forumPosts);
    } catch (err) {
      console.error(err);
      alert("שגיאה בפרסום ההודעה.");
    } finally {
      setPublishing(false);
    }
  };

  const handleTaskToggle = async (e: React.MouseEvent, taskId: string, currentStatus: TaskStatus | null, taskVersion: number) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    const isCompleted = !!(currentStatus && currentStatus.completedAt);
    const now = new Date().toISOString();
    
    const updatedStatus = {
      completedAt: isCompleted ? null : now,
      viewedAt: currentStatus?.viewedAt || now,
      lastSeenVersion: taskVersion
    };

    await dbService.saveTaskStatus(taskId, currentUser.id, updatedStatus);
    
    // Refresh state
    const s = await dbService.getTaskStatus(taskId, currentUser.id);
    setTaskStatuses({
      ...taskStatuses,
      [taskId]: s
    });
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header back row */}
      <div style={topRowStyle}>
        <button onClick={() => setPage('forums')} style={backBtnStyle}>
          <ArrowRight size={18} />
          <span>חזור לכל הפורומים</span>
        </button>
      </div>

      <div style={titleHeaderStyle}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>{forum.name}</h1>
          <p className="text-muted">{forum.description}</p>
        </div>
        {isManager && (
          <button onClick={onCreateTask} className="btn btn-primary" style={pubTaskBtnStyle}>
            <Plus size={16} />
            <span>פרסם משימה בפורום</span>
          </button>
        )}
      </div>

      {/* Publisher Composer - visible only to managers */}
      {isManager && (
        <div className="card" style={composerCardStyle}>
          <h3 style={{ marginBottom: '12px' }}>פרסם הודעה חדשה ללוח</h3>
          <form onSubmit={handleCreatePost}>
            <textarea
              className="form-control"
              placeholder="כתוב כאן הודעה, הנחיה או עדכון לצוות..."
              rows={3}
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              disabled={publishing}
              style={{ marginBottom: '12px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={publishing || !newPostText.trim()}
                style={sendBtnStyle}
              >
                <Send size={16} />
                <span>{publishing ? 'מפרסם...' : 'פרסם הודעה'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Feed Timeline */}
      <div style={feedTimelineStyle}>
        {posts.length === 0 ? (
          <div style={emptyCardStyle}>
            <Megaphone size={36} color="var(--outline)" />
            <h3>לוח המודעות ריק</h3>
            <p className="text-muted">אין פרסומים בפורום זה כרגע.</p>
          </div>
        ) : (
          posts.map(post => {
            const date = new Date(post.createdAt).toLocaleDateString('he-IL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isTask = post.type === 'task' && post.taskId;
            const refTask = isTask ? tasks[post.taskId!] : null;
            const refStatus = isTask ? taskStatuses[post.taskId!] : null;
            const isCompleted = !!(refStatus && refStatus.completedAt);

            return (
              <div key={post.id} className="card fade-in" style={postCardStyle}>
                {/* Post Header */}
                <div style={postHeaderStyle}>
                  <div style={publisherInfoStyle}>
                    <div style={avatarFallbackStyle}>
                      <UserIcon size={14} />
                    </div>
                    <div>
                      <div style={publisherNameStyle}>
                        {post.publisherId === 'user_meir' ? 'מאיר' : post.publisherId === 'user_roni' ? 'רוני' : post.publisherId === 'user_alon' ? 'אלון' : 'סגל'}
                      </div>
                      <div style={publisherRoleStyle}>מנהל פורום</div>
                    </div>
                  </div>
                  <span style={postDateStyle}>{date}</span>
                </div>

                {/* Post Content */}
                <div style={postContentStyle}>
                  <p style={{ whiteSpace: 'pre-line' }}>{post.content}</p>
                </div>

                {/* Task Reference Widget */}
                {isTask && refTask && (
                  <div 
                    onClick={() => {
                      setSelectedTaskId(refTask.id);
                      setPage('task-details');
                    }}
                    style={taskWidgetStyle(isCompleted)}
                  >
                    <button
                      onClick={(e) => handleTaskToggle(e, refTask.id, refStatus, refTask.version)}
                      className={`checkbox-custom ${isCompleted ? 'checked' : ''}`}
                      style={{ flexShrink: 0 }}
                    >
                      {isCompleted && <CheckCircle size={14} color="white" />}
                    </button>
                    
                    <div style={{ flex: 1 }}>
                      <div style={isCompleted ? completedWidgetTitleStyle : widgetTitleStyle}>
                        {refTask.title}
                      </div>
                      <div style={widgetMetaStyle}>
                        <Calendar size={12} />
                        <span>יעד להגשה: {new Date(refTask.dueDate).toLocaleDateString('he-IL')}</span>
                      </div>
                    </div>
                  </div>
                )}
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

const errorStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: 'var(--on-surface-variant)'
};

const topRowStyle: React.CSSProperties = {
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

const titleHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '24px'
};

const pubTaskBtnStyle: React.CSSProperties = {
  minHeight: '40px',
  padding: '8px 16px',
  fontSize: '0.85rem'
};

const composerCardStyle: React.CSSProperties = {
  marginBottom: '24px',
  border: '1px solid var(--outline)',
  boxShadow: 'var(--shadow-card-hover)'
};

const sendBtnStyle: React.CSSProperties = {
  minHeight: '36px',
  padding: '6px 16px',
  fontSize: '0.85rem'
};

const feedTimelineStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const postCardStyle: React.CSSProperties = {
  padding: '24px',
  marginBottom: 0
};

const postHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--surface-container-high)',
  paddingBottom: '12px',
  marginBottom: '16px'
};

const publisherInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: 'var(--rounded-full)',
  backgroundColor: 'var(--surface-container-high)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)'
};

const publisherNameStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  lineHeight: '1.2'
};

const publisherRoleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--outline)',
  lineHeight: '1.2'
};

const postDateStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--outline)'
};

const postContentStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: 'var(--on-surface)',
  marginBottom: '16px',
  lineHeight: '1.6'
};

const taskWidgetStyle = (completed: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  backgroundColor: completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-container-low)',
  border: completed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-md)',
  padding: '16px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease'
});

const widgetTitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: 'var(--on-surface)'
};

const completedWidgetTitleStyle: React.CSSProperties = {
  ...widgetTitleStyle,
  textDecoration: 'line-through',
  color: 'var(--outline)',
  opacity: 0.7
};

const widgetMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.75rem',
  color: 'var(--outline)',
  marginTop: '4px'
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
