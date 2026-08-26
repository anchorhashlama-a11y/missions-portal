import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { backendService } from '../services/backend';
import type { Task, Tag, User, TaskDocument } from '../types';
import { ArrowRight, Plus, Trash, Save, AlertTriangle } from 'lucide-react';

interface TaskFormProps {
  taskId?: string; // If provided, we are editing
  setPage: (page: string) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ taskId, setPage }) => {
  const { currentUser, activeRole, refreshAuthData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [link, setLink] = useState('');
  const [linkText, setLinkText] = useState('');
  
  // Attachments State
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  // Target Audience State
  const [targetTagIds, setTargetTagIds] = useState<string[]>([]);
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  
  // Scope validation variables
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  // Edit variables
  const [isSignificantEdit, setIsSignificantEdit] = useState(false);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);

  useEffect(() => {
    const loadFormData = async () => {
      if (!currentUser || !activeRole) return;
      try {
        setLoading(true);

        // Load database metadata
        const allTags = await dbService.getTags();
        const allUsers = await dbService.getUsers();
        const allUserTags = await dbService.getUserTags();

        // 1. Filter TARGETS by ACTIVE ROLE SCOPE
        const scopeUserIds = backendService.getUsersInScope(activeRole, allUsers, allUserTags);
        
        if (activeRole.scopeType === 'all') {
          setAvailableTags(allTags);
          setAvailableUsers(allUsers.filter(u => u.id !== currentUser.id));
        } else if (activeRole.scopeType === 'tags' && activeRole.scopeTagIds) {
          // List only tags within the scope
          setAvailableTags(allTags.filter(t => activeRole.scopeTagIds!.includes(t.id)));
          // List only users within the scope
          setAvailableUsers(allUsers.filter(u => scopeUserIds.includes(u.id) && u.id !== currentUser.id));
        } else if (activeRole.scopeType === 'users' && activeRole.scopeUserIds) {
          setAvailableTags([]);
          setAvailableUsers(allUsers.filter(u => scopeUserIds.includes(u.id) && u.id !== currentUser.id));
        }

        // 2. Populate form fields if EDIT mode
        if (taskId) {
          const existingTask = await dbService.getTask(taskId);
          if (existingTask) {
            setOriginalTask(existingTask);
            setTitle(existingTask.title);
            setDescription(existingTask.description);
            
            // Format ISO date to local input datetime-local compatible string
            const date = new Date(existingTask.dueDate);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset*60*1000));
            setDueDate(localDate.toISOString().slice(0, 16));

            setLink(existingTask.link || '');
            setLinkText(existingTask.linkText || '');
            setDocuments(existingTask.documents || []);
            setTargetTagIds(existingTask.targetTagIds || []);
            setTargetUserIds(existingTask.targetUserIds || []);
          }
        }
      } catch (err) {
        console.error(err);
        setError("שגיאה בטעינת נתוני הטופס.");
      } finally {
        setLoading(false);
      }
    };
    loadFormData();
  }, [taskId, currentUser, activeRole]);

  if (loading) {
    return <div style={loadingStyle}>טוען...</div>;
  }

  // Handle document additions
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    setDocuments([...documents, { name: newDocName.trim(), url: newDocUrl.trim() || '#' }]);
    setNewDocName('');
    setNewDocUrl('');
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, idx) => idx !== index));
  };

  // Handle target tag toggling
  const handleTagToggle = (tagId: string) => {
    if (targetTagIds.includes(tagId)) {
      setTargetTagIds(targetTagIds.filter(id => id !== tagId));
    } else {
      setTargetTagIds([...targetTagIds, tagId]);
    }
  };

  // Form Submit Action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeRole) return;
    
    // Validations
    if (!title.trim() || !description.trim() || !dueDate) {
      setError("אנא מלא את כל שדות החובה (כותרת, תיאור, ותאריך יעד).");
      return;
    }
    
    if (targetTagIds.length === 0 && targetUserIds.length === 0) {
      setError("אנא בחר לפחות קהל יעד אחד (קבוצה או משתמשים ידניים).");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Convert local date back to ISO UTC string
      const isoDueDate = new Date(dueDate).toISOString();

      // 1. SECURITY CHECK: Validate that targets are within active role scope
      const allUsers = await dbService.getUsers();
      const allUserTags = await dbService.getUserTags();
      const isScopeValid = backendService.validatePublishScope(
        activeRole,
        targetTagIds,
        targetUserIds,
        allUsers,
        allUserTags
      );

      if (!isScopeValid) {
        setError("שגיאת אבטחה: קהל היעד שנבחר חורג מתחום האחריות המוגדר לתפקיד שלך.");
        setSaving(false);
        return;
      }

      if (taskId && originalTask) {
        // EDIT MODE
        let updatedVersion = originalTask.version;
        if (isSignificantEdit) {
          updatedVersion += 1;
        }

        const updatedTask: Partial<Task> = {
          title: title.trim(),
          description: description.trim(),
          dueDate: isoDueDate,
          link: link.trim(),
          linkText: linkText.trim(),
          documents,
          targetTagIds,
          targetUserIds,
          version: updatedVersion
        };

        await dbService.updateTask(taskId, updatedTask);

        // Seed Forum post alert if significant edit
        if (isSignificantEdit) {
          // Find associated forums
          const allForums = await dbService.getForums();
          const targetForums = allForums.filter(f => f.tagId && targetTagIds.includes(f.tagId));
          
          for (const f of targetForums) {
            await dbService.createForumPost({
              forumId: f.id,
              publisherId: currentUser.id,
              publisherRoleId: activeRole.id,
              type: 'message',
              content: `עודכן עדכון משמעותי במשימה: "${title.trim()}" - תאריך היעד עודכן ל-${new Date(isoDueDate).toLocaleDateString('he-IL')}. אנא בדקו את הפרטים החדשים.`,
              taskId: originalTask.id
            });
          }
        }
      } else {
        // CREATE MODE
        const newTaskData = {
          title: title.trim(),
          description: description.trim(),
          publisherId: currentUser.id,
          publisherRoleId: activeRole.id,
          dueDate: isoDueDate,
          link: link.trim(),
          linkText: linkText.trim(),
          documents,
          targetTagIds,
          targetUserIds,
        };

        const createdTask = await dbService.createTask(newTaskData);

        // Automatically publish an alert to the forums of target groups
        const allForums = await dbService.getForums();
        const targetForums = allForums.filter(f => f.tagId && targetTagIds.includes(f.tagId));
        
        // If general/staff, add to general forum
        if (activeRole.id === 'role_maham' || targetTagIds.length === 0) {
          const generalForum = allForums.find(f => f.type === 'general');
          if (generalForum) {
            await dbService.createForumPost({
              forumId: generalForum.id,
              publisherId: currentUser.id,
              publisherRoleId: activeRole.id,
              type: 'task',
              content: `משימה כללית חדשה התפרסמה: "${title.trim()}"`,
              taskId: createdTask.id
            });
          }
        }

        // Add to team forums
        for (const f of targetForums) {
          await dbService.createForumPost({
            forumId: f.id,
            publisherId: currentUser.id,
            publisherRoleId: activeRole.id,
            type: 'task',
            content: `משימה חדשה לקבוצה: "${title.trim()}"`,
            taskId: createdTask.id
          });
        }
      }

      await refreshAuthData();
      setPage('management'); // Go back to management screen
    } catch (err) {
      console.error(err);
      setError("שגיאה בשמירת המשימה.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back button header */}
      <div style={topRowStyle}>
        <button onClick={() => setPage('management')} style={backBtnStyle}>
          <ArrowRight size={18} />
          <span>ביטול וחזרה ללוח ניהול</span>
        </button>
      </div>

      <h1 style={{ marginBottom: '24px' }}>
        {taskId ? 'עריכת משימה' : 'יצירת משימה חדשה'}
      </h1>

      {error && (
        <div style={errorAlertStyle}>
          <AlertTriangle size={18} style={{ marginLeft: '8px' }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        {/* Active Role Indicator */}
        <div style={roleIndicatorStyle}>
          מפרסם בתור: <b>{activeRole?.name}</b> (תחום אחריות: {activeRole?.scopeType === 'all' ? 'כלל ההשלמה' : activeRole?.scopeType === 'tags' ? 'קבוצות מוגדרות' : 'משתמשים ידניים'})
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">כותרת המשימה *</label>
          <input
            type="text"
            className="form-control"
            placeholder="לדוגמה: הגשת רפלקציה שבועית, מילוי שאלוני התנסות..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">תיאור המשימה ופרטים נוספים *</label>
          <textarea
            className="form-control"
            placeholder="פרט כאן את הנחיות המשימה, אילו קבצים יש להעלות ומה נדרש בדיוק..."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Action Link & Due Date */}
        <div style={formRowStyle}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">תאריך ושעת יעד *</label>
            <input
              type="datetime-local"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">קישור לביצוע (Google Form / גיליון) - אופציונלי</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://docs.google.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        {/* Link Text - only shown when a link is provided */}
        {link.trim() && (
          <div className="form-group">
            <label className="form-label">טקסט הכפתור לקישור - אופציונלי</label>
            <input
              type="text"
              className="form-control"
              placeholder='לדוגמה: "מלא את הטופס", "גש לגיליון" (ברירת מחדל: פתח קישור לביצוע המשימה)'
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              disabled={saving}
            />
          </div>
        )}


        {/* Target Audience Selectors */}
        <div className="form-group">
          <label className="form-label">קבוצות יעד להפצה * (בחר לפחות אחת)</label>
          <div style={tagsContainerStyle}>
            {availableTags.length === 0 ? (
              <span className="text-muted" style={{ padding: '8px 0' }}>אין קבוצות מוגדרות בטווח האחריות של התפקיד שלך.</span>
            ) : (
              availableTags.map(tag => {
                const isSelected = targetTagIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    style={isSelected ? activeTagBtnStyle : tagBtnStyle}
                  >
                    {tag.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Document Attachments Panel */}
        <div style={attachmentsPanelStyle}>
          <label className="form-label">מסמכים מצורפים</label>
          
          {documents.length > 0 && (
            <div style={docListStyle}>
              {documents.map((doc, idx) => (
                <div key={idx} style={docItemStyle}>
                  <span style={{ flex: 1 }}>{doc.name}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveDocument(idx)} 
                    style={deleteDocBtnStyle}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={addDocRowStyle}>
            <input
              type="text"
              className="form-control"
              placeholder="שם הקובץ (לדוגמה: סילבוס.pdf)"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              style={{ flex: '1 1 120px' }}
            />
            <input
              type="url"
              className="form-control"
              placeholder="קישור לקובץ"
              value={newDocUrl}
              onChange={(e) => setNewDocUrl(e.target.value)}
              style={{ flex: '1 1 120px' }}
            />
            <button 
              type="button" 
              onClick={handleAddDocument} 
              className="btn btn-secondary"
              style={addDocBtnStyle}
            >
              <Plus size={16} />
              הוסף
            </button>
          </div>
        </div>

        {/* Edit-specific actions */}
        {taskId && originalTask && (
          <div style={editSettingsStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={isSignificantEdit}
                onChange={(e) => setIsSignificantEdit(e.target.checked)}
                style={checkboxInputStyle}
              />
              <span style={{ fontWeight: 700, color: 'var(--status-urgent)' }}>
                סמן כעדכון משמעותי במשימה
              </span>
            </label>
            <p style={editHintStyle}>
              סימון זה יציג את המשימה מחדש עם תג "עודכן" עבור משתמשים שכבר סימנו אותה כנצפתה, ויחייב אותם לעבור עליה שוב.
            </p>
          </div>
        )}

        {/* Submit Actions */}
        <div style={submitRowStyle}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
            style={{ minWidth: '160px' }}
          >
            <Save size={18} />
            <span>{saving ? 'שומר...' : taskId ? 'שמור שינויים' : 'פרסם משימה'}</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => setPage('management')} 
            className="btn btn-secondary"
            disabled={saving}
          >
            ביטול
          </button>
        </div>
      </form>
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

const errorAlertStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  color: 'var(--status-urgent)',
  padding: '16px',
  borderRadius: 'var(--rounded-default)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  marginBottom: '24px',
  fontSize: '0.95rem'
};

const formStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-xl)',
  padding: '24px',
  boxShadow: 'var(--shadow-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const roleIndicatorStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-container-low)',
  color: 'var(--on-surface-variant)',
  padding: '12px 16px',
  borderRadius: 'var(--rounded-md)',
  fontSize: '0.9rem',
  marginBottom: '16px',
  border: '1px solid var(--outline-variant)'
};

const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap'
};

const tagsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '4px'
};

const tagBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--rounded-full)',
  border: '1px solid var(--outline-variant)',
  backgroundColor: 'var(--surface)',
  color: 'var(--on-surface)',
  cursor: 'pointer',
  fontSize: '0.88rem',
  fontWeight: 600,
  minHeight: '36px',
  transition: 'background-color 0.2s ease, border-color 0.2s ease'
};

const activeTagBtnStyle: React.CSSProperties = {
  ...tagBtnStyle,
  backgroundColor: 'var(--primary-container)',
  color: 'var(--on-primary-container)',
  borderColor: 'var(--primary)'
};

const attachmentsPanelStyle: React.CSSProperties = {
  borderTop: '1px solid var(--outline-variant)',
  paddingTop: '20px',
  marginTop: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const docListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const docItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--surface-container-low)',
  padding: '8px 16px',
  borderRadius: 'var(--rounded-md)',
  fontSize: '0.88rem',
  border: '1px solid var(--outline-variant)'
};

const deleteDocBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--status-urgent)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '4px'
};

const addDocRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const addDocBtnStyle: React.CSSProperties = {
  minHeight: '44px',
  flexShrink: 0
};

const editSettingsStyle: React.CSSProperties = {
  backgroundColor: 'rgba(245, 158, 11, 0.08)',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  padding: '16px',
  borderRadius: 'var(--rounded-md)',
  marginTop: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer'
};

const checkboxInputStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  cursor: 'pointer'
};

const editHintStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--on-surface-variant)',
  marginRight: '28px',
  margin: 0
};

const submitRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '24px',
  borderTop: '1px solid var(--outline-variant)',
  paddingTop: '20px'
};
