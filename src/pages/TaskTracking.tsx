import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { backendService } from '../services/backend';
import type { Task, TaskStatus, User, Tag, UserTag } from '../types';
import { 
  ArrowRight, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Users, 
  Calendar,
  Clock
} from 'lucide-react';

interface TaskTrackingProps {
  taskId: string;
  setPage: (page: string) => void;
}

interface UserProgressDetails {
  user: User;
  completed: boolean;
  viewed: boolean;
  status: TaskStatus | null;
  teams: Tag[];
}

export const TaskTracking: React.FC<TaskTrackingProps> = ({ taskId, setPage }) => {
  const { currentUser, activeRole } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupedProgress, setGroupedProgress] = useState<Record<string, {
    team: Tag | { id: string; name: string; category: string };
    users: UserProgressDetails[];
    completedCount: number;
  }>>({});
  const [summaryStats, setSummaryStats] = useState({ completed: 0, total: 0, percent: 0 });

  useEffect(() => {
    const fetchProgress = async () => {
      if (!currentUser || !activeRole) return;
      try {
        setLoading(true);
        const t = await dbService.getTask(taskId);
        if (!t) return;
        setTask(t);

        const allUsers = await dbService.getUsers();
        const allUserTags = await dbService.getUserTags();
        const allTags = await dbService.getTags();
        const allStatuses = await dbService.getTaskStatuses();

        // 1. Fetch progress filtered strictly to manager's scope
        const progress = backendService.getTaskProgressForRole(
          t,
          activeRole,
          allUsers,
          allUserTags,
          allStatuses
        );

        setSummaryStats({
          completed: progress.completedCount,
          total: progress.totalRecipients,
          percent: progress.progressPercent
        });

        // 2. Map teams to users and group them
        const userProgressList: UserProgressDetails[] = progress.details.map(item => {
          const myTags = allUserTags.filter(ut => ut.userId === item.user.id).map(ut => ut.tagId);
          const myTeams = allTags.filter(tag => tag.category === 'team' && myTags.includes(tag.id));
          
          return {
            ...item,
            teams: myTeams
          };
        });

        // 3. Perform grouping by Team
        const groups: Record<string, {
          team: Tag | { id: string; name: string; category: string };
          users: UserProgressDetails[];
          completedCount: number;
        }> = {};

        userProgressList.forEach(item => {
          // If user belongs to teams, add to those teams. If not, add to "Other"
          if (item.teams.length > 0) {
            item.teams.forEach(team => {
              if (!groups[team.id]) {
                groups[team.id] = {
                  team: team,
                  users: [],
                  completedCount: 0
                };
              }
              groups[team.id].users.push(item);
              if (item.completed) {
                groups[team.id].completedCount++;
              }
            });
          } else {
            const noTeamId = 'no_team';
            if (!groups[noTeamId]) {
              groups[noTeamId] = {
                team: { id: noTeamId, name: 'ללא צוות מוגדר', category: 'team' },
                users: [],
                completedCount: 0
              };
            }
            groups[noTeamId].users.push(item);
            if (item.completed) {
              groups[noTeamId].completedCount++;
            }
          }
        });

        setGroupedProgress(groups);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [taskId, currentUser, activeRole]);

  if (loading) {
    return <div style={loadingStyle}>טוען דוח מעקב...</div>;
  }

  if (!task) {
    return (
      <div style={errorStyle}>
        <h3>משימה לא נמצאה</h3>
        <button onClick={() => setPage('management')} className="btn btn-primary">
          חזור ללוח ניהול
        </button>
      </div>
    );
  }

  const dueDate = new Date(task.dueDate).toLocaleDateString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fade-in">
      {/* Top back row */}
      <div style={topRowStyle}>
        <button onClick={() => setPage('management')} style={backBtnStyle}>
          <ArrowRight size={18} />
          <span>חזור ללוח ניהול</span>
        </button>
      </div>

      {/* Task Info Summary */}
      <div className="card" style={headerCardStyle}>
        <div style={headerHeaderStyle}>
          <div>
            <h1 style={titleStyle}>{task.title}</h1>
            <p className="text-muted" style={{ marginTop: '4px' }}>
              תפקיד מפקח: <b>{activeRole?.name}</b> (מציג נתוני ביצוע בטווח אחריותך בלבד)
            </p>
          </div>
          <div style={metaBadgeStyle}>
            <Calendar size={14} />
            <span>תאריך יעד: {dueDate}</span>
          </div>
        </div>

        {/* Global Progress for this manager */}
        <div style={progressContainerStyle}>
          <div style={progressLabelStyle}>
            <span>התקדמות כוללת בתחום שלך:</span>
            <b>{summaryStats.completed} מתוך {summaryStats.total} ({summaryStats.percent}%)</b>
          </div>
          <div className="progress-bar-container" style={{ height: '12px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ width: `${summaryStats.percent}%`, backgroundColor: 'var(--status-success)' }}
            />
          </div>
        </div>
      </div>

      {/* Grouped Lists */}
      <div style={groupsContainerStyle}>
        {Object.keys(groupedProgress).length === 0 ? (
          <div style={emptyCardStyle}>
            <Users size={32} color="var(--outline)" />
            <h3>אין משתמשים להצגה</h3>
            <p className="text-muted">אין נמענים תחת טווח האחריות שלך שקיבלו את המשימה הזו.</p>
          </div>
        ) : (
          Object.values(groupedProgress).map(group => {
            const teamProgressPercent = group.users.length > 0 
              ? Math.round((group.completedCount / group.users.length) * 100)
              : 0;

            return (
              <div key={group.team.id} className="card" style={groupCardStyle}>
                {/* Group Header */}
                <div style={groupHeaderStyle}>
                  <div style={groupTitleContainerStyle}>
                    <Users size={18} color="var(--primary)" />
                    <h3 style={groupTitleStyle}>{group.team.name}</h3>
                  </div>
                  
                  <div style={groupStatsStyle}>
                    <span>{group.completedCount} / {group.users.length} ביצעו</span>
                    <span style={groupPercentStyle}>{teamProgressPercent}%</span>
                  </div>
                </div>

                {/* Group Users List */}
                <div style={usersListStyle}>
                  {group.users.map(item => (
                    <div key={item.user.id} style={userRowStyle}>
                      {/* User Bio */}
                      <div style={userBioStyle}>
                        {item.user.avatar ? (
                          <img src={item.user.avatar} alt="" style={avatarStyle} />
                        ) : (
                          <div style={avatarFallbackStyle}><Users size={14} /></div>
                        )}
                        <div>
                          <div style={userNameStyle}>{item.user.name}</div>
                          <div style={userEmailStyle}>{item.user.email}</div>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div style={userStatusSectionStyle}>
                        {/* Viewed Status */}
                        <div style={statusBadgeStyle(item.viewed)}>
                          {item.viewed ? (
                            <>
                              <Eye size={14} />
                              <span>נצפה</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} />
                              <span>לא נצפה</span>
                            </>
                          )}
                        </div>

                        {/* Completed Status */}
                        <div style={completedBadgeStyle(item.completed)}>
                          {item.completed ? (
                            <>
                              <Check size={14} />
                              <span>בוצע</span>
                            </>
                          ) : (
                            <>
                              <Clock size={14} />
                              <span>טרם בוצע</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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

const headerCardStyle: React.CSSProperties = {
  padding: '24px',
  marginBottom: '24px'
};

const headerHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '20px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'var(--primary)',
  margin: 0
};

const metaBadgeStyle: React.CSSProperties = {
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

const progressContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  backgroundColor: 'var(--surface-container-low)',
  padding: '16px',
  borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--outline-variant)'
};

const progressLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.88rem',
  color: 'var(--on-surface)'
};

const groupsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const groupCardStyle: React.CSSProperties = {
  padding: '24px',
  marginBottom: 0
};

const groupHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--surface-container-high)',
  paddingBottom: '12px',
  marginBottom: '16px'
};

const groupTitleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const groupTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 800,
  color: 'var(--on-surface)',
  margin: 0
};

const groupStatsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--on-surface-variant)'
};

const groupPercentStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary-container)',
  color: 'var(--on-primary-container)',
  padding: '2px 8px',
  borderRadius: 'var(--rounded-sm)'
};

const usersListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const userRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  backgroundColor: 'var(--surface-container-low)',
  borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--outline-variant)',
  flexWrap: 'wrap',
  gap: '12px'
};

const userBioStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const avatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--rounded-full)',
  objectFit: 'cover'
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--rounded-full)',
  backgroundColor: 'var(--surface-container-high)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)'
};

const userNameStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 700,
  lineHeight: '1.2'
};

const userEmailStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--outline)',
  lineHeight: '1.2',
  marginTop: '2px'
};

const userStatusSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const statusBadgeStyle = (active: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.8rem',
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 'var(--rounded-sm)',
  backgroundColor: active ? 'rgba(0, 60, 144, 0.05)' : 'var(--surface-container-high)',
  color: active ? 'var(--primary)' : 'var(--outline)',
  border: '1px solid var(--outline-variant)'
});

const completedBadgeStyle = (completed: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.8rem',
  fontWeight: 700,
  padding: '6px 12px',
  borderRadius: 'var(--rounded-sm)',
  backgroundColor: completed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
  color: completed ? 'var(--status-success)' : 'var(--status-pending)',
  border: completed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
});

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
