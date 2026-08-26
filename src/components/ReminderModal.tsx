import React, { useState, useEffect } from 'react';
import type { TaskReminder, Task } from '../types';
import { dbService } from '../services/db';
import { Bell, X, ArrowLeft, Calendar } from 'lucide-react';

interface ReminderModalProps {
  reminders: TaskReminder[];
  onDismiss: (reminderId: string) => Promise<void>;
  onNavigateToTask: (taskId: string) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  reminders,
  onDismiss,
  onNavigateToTask
}) => {
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      const taskMap: Record<string, Task> = {};
      for (const reminder of reminders) {
        if (!taskMap[reminder.taskId]) {
          const task = await dbService.getTask(reminder.taskId);
          if (task) taskMap[reminder.taskId] = task;
        }
      }
      setTasks(taskMap);
    };
    if (reminders.length > 0) loadTasks();
  }, [reminders]);

  if (!visible || reminders.length === 0) return null;

  const current = reminders[currentIndex];
  const task = tasks[current?.taskId];
  const isLast = currentIndex === reminders.length - 1;

  const handleDismiss = async () => {
    await onDismiss(current.id);
    if (isLast) {
      setVisible(false);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleGoToTask = async () => {
    await onDismiss(current.id);
    setVisible(false);
    if (task) onNavigateToTask(task.id);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div style={backdropStyle} />

      {/* Modal */}
      <div style={modalWrapperStyle}>
        <div style={modalStyle} className="fade-in">
          {/* Header */}
          <div style={modalHeaderStyle}>
            <div style={bellIconWrapperStyle}>
              <Bell size={24} color="white" />
            </div>
            <button onClick={handleDismiss} style={closeBtnStyle} title="סגור">
              <X size={18} />
            </button>
          </div>

          {/* Counter */}
          {reminders.length > 1 && (
            <div style={counterStyle}>
              {currentIndex + 1} מתוך {reminders.length} תזכורות
            </div>
          )}

          {/* Content */}
          <div style={contentStyle}>
            <h2 style={titleStyle}>תזכורת למשימה</h2>

            {task ? (
              <>
                <div style={taskCardStyle}>
                  <div style={taskTitleStyle}>{task.title}</div>
                  <div style={dueDateStyle}>
                    <Calendar size={14} style={{ marginLeft: '6px', flexShrink: 0 }} />
                    תאריך יעד: <strong style={{ marginRight: '4px' }}>{formatDate(task.dueDate)}</strong>
                  </div>
                </div>

                <p style={reminderTextStyle}>
                  📌 קיבלת תזכורת זו כי המשימה טרם בוצעה על ידך.
                  <br />
                  אנא הקפד לבצע אותה לפני התאריך המצוין.
                </p>
              </>
            ) : (
              <p style={reminderTextStyle}>טוען פרטי משימה...</p>
            )}
          </div>

          {/* Actions */}
          <div style={actionsStyle}>
            {task && (
              <button onClick={handleGoToTask} className="btn btn-primary" style={primaryBtnStyle}>
                <ArrowLeft size={16} />
                עבור למשימה
              </button>
            )}
            <button onClick={handleDismiss} className="btn btn-secondary" style={secondaryBtnStyle}>
              {isLast ? 'הבנתי, לא לשכוח!' : 'הבא'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000
};

const modalWrapperStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1001,
  padding: '16px'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  borderRadius: 'var(--rounded-xl)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  border: '1px solid var(--outline-variant)',
  width: '100%',
  maxWidth: '440px',
  overflow: 'hidden',
  direction: 'rtl'
};

const modalHeaderStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--primary), #1a56c4)',
  padding: '20px 20px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const bellIconWrapperStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: 'var(--rounded-full)',
  backgroundColor: 'rgba(255,255,255,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)',
  border: 'none',
  borderRadius: 'var(--rounded-full)',
  color: 'white',
  cursor: 'pointer',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s'
};

const counterStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-container-low)',
  textAlign: 'center',
  padding: '6px',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--on-surface-variant)'
};

const contentStyle: React.CSSProperties = {
  padding: '24px 20px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 800,
  color: 'var(--on-surface)',
  marginBottom: '16px'
};

const taskCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary-container)',
  borderRadius: 'var(--rounded-md)',
  padding: '14px 16px',
  marginBottom: '16px',
  border: '1px solid rgba(0,60,144,0.15)'
};

const taskTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--on-primary-container)',
  marginBottom: '8px'
};

const dueDateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: 'var(--on-primary-container)',
  opacity: 0.85
};

const reminderTextStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--on-surface-variant)',
  lineHeight: 1.7
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  padding: '0 20px 20px',
  flexDirection: 'row-reverse'
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  minHeight: '44px'
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  minHeight: '44px'
};
