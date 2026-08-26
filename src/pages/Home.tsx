import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { backendService } from '../services/backend';
import type { Task, TaskStatus, ForumPost, Forum } from '../types';
import { TaskCard } from '../components/TaskCard';
import { 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  ArrowLeft,
  Bell
} from 'lucide-react';

interface HomeProps {
  setPage: (page: string) => void;
  setSelectedTaskId: (id: string) => void;
  setSelectedForumId: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setPage, setSelectedTaskId, setSelectedForumId }) => {
  const { currentUser, activeRole } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [recentPosts, setRecentPosts] = useState<{ post: ForumPost; forumName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        // Load data in parallel where possible
        const [allTasks, allUsers, allUserTags, allStatuses, allForums] = await Promise.all([
          dbService.getTasks(),
          dbService.getUsers(),
          dbService.getUserTags(),
          dbService.getTaskStatuses(),
          dbService.getForums()
        ]);

        const userTasks = backendService.getTasksForUser(currentUser.id, allTasks, allUsers, allUserTags);
        setTasks(userTasks);
        setStatuses(allStatuses);

        // Load recent posts from user's forums
        const myTagIds = allUserTags.filter(ut => ut.userId === currentUser.id).map(ut => ut.tagId);
        
        // Filter forums the user has access to
        const myForums = allForums.filter(f => !f.tagId || myTagIds.includes(f.tagId));
        
        const postsWithForum: { post: ForumPost; forumName: string }[] = [];
        for (const forum of myForums) {
          const forumPosts = await dbService.getForumPosts(forum.id);
          // Get the latest post in this forum
          if (forumPosts.length > 0) {
            postsWithForum.push({
              post: forumPosts[0],
              forumName: forum.name
            });
          }
        }
        // Sort by date desc and take top 3
        postsWithForum.sort((a, b) => b.post.createdAt.localeCompare(a.post.createdAt));
        setRecentPosts(postsWithForum.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, activeRole]);

  if (loading) {
    return <div style={loadingStyle}>טוען...</div>;
  }

  // Calculate task counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => {
    const status = statuses.find(s => s.taskId === t.id && s.userId === currentUser?.id);
    return !!(status && status.completedAt);
  }).length;
  const pendingTasks = totalTasks - completedTasks;

  const urgentTasks = tasks.filter(t => {
    const status = statuses.find(s => s.taskId === t.id && s.userId === currentUser?.id);
    const isCompleted = !!(status && status.completedAt);
    const dueDate = new Date(t.dueDate);
    const diffTime = dueDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2 && !isCompleted;
  });

  const newCount = tasks.filter(t => {
    const status = statuses.find(s => s.taskId === t.id && s.userId === currentUser?.id);
    return !status || !status.viewedAt;
  }).length;

  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation(); // Prevent card navigation
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
    
    // Refresh local state
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

  return (
    <div className="fade-in">
      <div style={welcomeRowStyle}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>שלום, {currentUser?.name} 👋</h1>
          <p className="text-muted">כאן מוצגת תמונת המצב היומית של המשימות והעדכונים שלך.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={metricsGridStyle}>
        <div style={{ ...metricCardStyle, borderRight: '4px solid var(--primary)' }}>
          <div style={metricIconContainerStyle}><CheckCircle color="var(--primary)" /></div>
          <div>
            <div style={metricLabelStyle}>משימות פתוחות</div>
            <div style={metricValStyle}>{pendingTasks} מתוך {totalTasks}</div>
          </div>
        </div>

        <div style={{ ...metricCardStyle, borderRight: '4px solid var(--status-urgent)' }}>
          <div style={metricIconContainerStyle}><AlertCircle color="var(--status-urgent)" /></div>
          <div>
            <div style={metricLabelStyle}>משימות דחופות</div>
            <div style={metricValStyle}>{urgentTasks.length} ביומיים הקרובים</div>
          </div>
        </div>

        <div style={{ ...metricCardStyle, borderRight: '4px solid var(--status-pending)' }}>
          <div style={metricIconContainerStyle}><Bell color="var(--status-pending)" /></div>
          <div>
            <div style={metricLabelStyle}>חדש בשבילי</div>
            <div style={metricValStyle}>{newCount} פריטים שלא נקראו</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={mainGridStyle}>
        {/* Urgent & Important Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2>משימות קרובות</h2>
            <button onClick={() => setPage('tasks')} className="btn btn-secondary" style={viewAllBtnStyle}>
              הצג את כל המשימות
              <ArrowLeft size={16} />
            </button>
          </div>

          {tasks.filter(t => {
            const status = statuses.find(s => s.taskId === t.id && s.userId === currentUser?.id);
            return !status || !status.completedAt;
          }).slice(0, 3).length === 0 ? (
            <div style={emptyCardStyle}>
              <CheckCircle size={32} color="var(--status-success)" style={{ marginBottom: '8px' }} />
              <div>אין משימות פתוחות! עבודה מצוינת.</div>
            </div>
          ) : (
            tasks.filter(t => {
              const status = statuses.find(s => s.taskId === t.id && s.userId === currentUser?.id);
              return !status || !status.completedAt;
            }).slice(0, 3).map(task => {
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

        {/* Forum Updates Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2>עדכונים מהפורומים</h2>
            <button onClick={() => setPage('forums')} className="btn btn-secondary" style={viewAllBtnStyle}>
              לכל הפורומים
              <ArrowLeft size={16} />
            </button>
          </div>

          <div style={forumListStyle}>
            {recentPosts.length === 0 ? (
              <div style={emptyCardStyle}>
                <MessageSquare size={32} color="var(--outline)" style={{ marginBottom: '8px' }} />
                <div>אין עדכונים חדשים בפורומים שלך.</div>
              </div>
            ) : (
              recentPosts.map(({ post, forumName }) => {
                const date = new Date(post.createdAt).toLocaleDateString('he-IL', {
                  day: '2-digit',
                  month: '2-digit'
                });
                return (
                  <div 
                    key={post.id} 
                    className="card" 
                    onClick={() => {
                      setSelectedForumId(post.forumId);
                      setPage('forum-feed');
                    }}
                    style={postCardStyle}
                  >
                    <div style={postMetaRowStyle}>
                      <span style={forumTagStyle}>{forumName}</span>
                      <span style={postDateStyle}>{date}</span>
                    </div>
                    <p style={postContentStyle}>{post.content}</p>
                    <div style={postFooterStyle}>
                      <span>פורסם על ידי: <b>{post.publisherId === 'user_meir' ? 'מאיר' : post.publisherId === 'user_roni' ? 'רוני' : post.publisherId === 'user_alon' ? 'אלון' : 'סגל'}</b></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline styles
const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  fontSize: '1.2rem',
  fontWeight: 'bold'
};

const welcomeRowStyle: React.CSSProperties = {
  marginBottom: '24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const metricsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
  marginBottom: '40px'
};

const metricCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  borderRadius: 'var(--rounded-lg)',
  border: '1px solid var(--outline-variant)',
  padding: '22px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  boxShadow: 'var(--shadow-card)'
};

const metricIconContainerStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: 'var(--rounded-full)',
  backgroundColor: 'var(--surface-container-high)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 700,
  color: 'var(--on-surface-variant)'
};

const metricValStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 800,
  color: 'var(--on-surface)',
  marginTop: '2px'
};

const mainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
  gap: '24px'
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
};

const viewAllBtnStyle: React.CSSProperties = {
  minHeight: '36px',
  padding: '6px 12px',
  fontSize: '0.85rem'
};

const emptyCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-container-low)',
  borderRadius: 'var(--rounded-xl)',
  border: '1px dotted var(--outline)',
  padding: '40px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)',
  fontSize: '0.95rem'
};

const forumListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const postCardStyle: React.CSSProperties = {
  cursor: 'pointer',
  padding: '16px',
  marginBottom: 0
};

const postMetaRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
};

const forumTagStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  backgroundColor: 'var(--primary-container)',
  color: 'var(--on-primary-container)',
  padding: '2px 8px',
  borderRadius: 'var(--rounded-sm)'
};

const postDateStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--outline)'
};

const postContentStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--on-surface)',
  margin: '8px 0',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const postFooterStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--outline)',
  borderTop: '1px solid var(--surface-container-high)',
  paddingTop: '8px',
  marginTop: '4px'
};
