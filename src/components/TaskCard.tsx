import React from 'react';
import type { Task, TaskStatus } from '../types';
import { Calendar, Link as LinkIcon, Paperclip, Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  status: TaskStatus | null;
  onToggleComplete: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  status, 
  onToggleComplete, 
  onClick 
}) => {
  const isCompleted = !!(status && status.completedAt);
  const isViewed = !!(status && status.viewedAt);
  
  // Calculate if task is updated (viewed version is older than current version)
  const isUpdated = isViewed && status && status.lastSeenVersion < task.version;
  const isNew = !isViewed;

  // Calculate due date warnings
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now && !isCompleted;
  
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays >= 0 && diffDays <= 2 && !isCompleted;

  // Formatting date
  const formattedDate = new Date(task.dueDate).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate card layout classes
  let cardClass = "card fade-in";
  if (isNew) cardClass += " unread";
  else if (isUpdated) cardClass += " unread"; // Blue bar or Orange bar

  if (isOverdue || task.isUrgent || isUrgent) cardClass += " urgent";

  return (
    <div className={cardClass} onClick={onClick} style={cardWrapperStyle}>
      {/* Checkbox (RTL: on the right side) */}
      <button 
        onClick={onToggleComplete}
        className={`checkbox-custom ${isCompleted ? 'checked' : ''}`}
        style={checkboxStyle}
        title={isCompleted ? "סמן כלא בוצע" : "סמן כבוצע"}
      >
        {isCompleted && <Check size={14} color="white" />}
      </button>

      {/* Task Content */}
      <div style={contentStyle}>
        <div style={titleRowStyle}>
          <h3 style={isCompleted ? completedTitleStyle : titleStyle}>
            {task.title}
          </h3>
          
          {/* Badges indicators */}
          <div style={badgeContainerStyle}>
            {isNew && (
              <span style={newBadgeStyle}>חדש</span>
            )}
            {isUpdated && (
              <span style={updatedBadgeStyle}>עודכן</span>
            )}
            {isOverdue && (
              <span style={overdueBadgeStyle}>באיחור</span>
            )}
            {isUrgent && (
              <span style={urgentBadgeStyle}>דחוף</span>
            )}
          </div>
        </div>

        <p style={descriptionStyle}>{task.description}</p>

        {/* Metadata info */}
        <div style={metaRowStyle}>
          <div style={metaItemStyle}>
            <Calendar size={14} />
            <span>יעד: {formattedDate}</span>
          </div>

          <div style={metaRightStyle}>
            {task.link && (
              <div style={attachmentIconStyle} title="כולל קישור">
                <LinkIcon size={14} />
              </div>
            )}
            {task.documents && task.documents.length > 0 && (
              <div style={attachmentIconStyle} title={`${task.documents.length} מסמכים`}>
                <Paperclip size={14} />
                <span style={docCountStyle}>{task.documents.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS styles for TaskCard
const cardWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  cursor: 'pointer',
  paddingRight: '12px' // offset due to left/right border
};

const checkboxStyle: React.CSSProperties = {
  marginTop: '4px'
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '8px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  margin: 0,
  color: 'var(--on-surface)'
};

const completedTitleStyle: React.CSSProperties = {
  ...titleStyle,
  textDecoration: 'line-through',
  color: 'var(--outline)',
  opacity: 0.7
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--on-surface-variant)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  margin: 0
};

const badgeContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px'
};

const badgeBaseStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: 'var(--rounded-full)',
  lineHeight: '1.2'
};

const newBadgeStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  backgroundColor: 'rgba(245, 158, 11, 0.15)',
  color: 'var(--status-pending)'
};

const updatedBadgeStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  backgroundColor: 'rgba(0, 60, 144, 0.15)',
  color: 'var(--primary)'
};

const overdueBadgeStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  color: 'var(--status-urgent)'
};

const urgentBadgeStyle: React.CSSProperties = {
  ...badgeBaseStyle,
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  color: 'var(--status-urgent)'
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '8px',
  fontSize: '0.8rem',
  color: 'var(--outline)'
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const metaRightStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px'
};

const attachmentIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  opacity: 0.7
};

const docCountStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600
};
