import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import type { Tag, Role, User, Forum, UserRole, UserTag } from '../types';
import { 
  Plus, 
  Edit, 
  Users, 
  Settings, 
  MessageSquare, 
  Save, 
  Check, 
  ShieldAlert
} from 'lucide-react';

export const SystemAdmin: React.FC = () => {
  const { refreshAuthData } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'tags' | 'roles' | 'users' | 'forums'>('tags');
  const [loading, setLoading] = useState(true);

  // DB Data
  const [tags, setTags] = useState<Tag[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [forums, setForums] = useState<Forum[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);

  // Editing forms state
  const [editingTag, setEditingTag] = useState<Partial<Tag> | null>(null);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [editingUserMapping, setEditingUserMapping] = useState<{
    user: User;
    roleIds: string[];
    tagIds: string[];
  } | null>(null);
  const [editingForum, setEditingForum] = useState<Partial<Forum> | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const t = await dbService.getTags();
      const r = await dbService.getRoles();
      const u = await dbService.getUsers();
      const f = await dbService.getForums();
      const ur = await dbService.getUserRoles();
      const ut = await dbService.getUserTags();

      setTags(t);
      setRoles(r);
      setUsers(u);
      setForums(f);
      setUserRoles(ur);
      setUserTags(ut);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={loadingStyle}>טוען הגדרות מערכת...</div>;
  }

  // --- TAGS ACTIONS ---
  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editingTag.name?.trim()) return;

    if (editingTag.id) {
      await dbService.updateTag(editingTag.id, editingTag);
    } else {
      await dbService.createTag({
        name: editingTag.name.trim(),
        category: editingTag.category || 'team'
      });
    }

    setEditingTag(null);
    await loadAllData();
  };

  // --- ROLES ACTIONS ---
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.name?.trim()) return;

    const rolePayload = {
      name: editingRole.name.trim(),
      permissions: editingRole.permissions || [],
      scopeType: editingRole.scopeType || 'tags',
      scopeTagIds: editingRole.scopeTagIds || [],
      scopeUserIds: editingRole.scopeUserIds || []
    };

    if (editingRole.id) {
      await dbService.updateRole(editingRole.id, rolePayload);
    } else {
      await dbService.createRole(rolePayload);
    }

    setEditingRole(null);
    await loadAllData();
    await refreshAuthData();
  };

  const handleTogglePermission = (perm: string) => {
    if (!editingRole) return;
    const currentPerms = editingRole.permissions || [];
    const updatedPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];
    setEditingRole({ ...editingRole, permissions: updatedPerms });
  };

  const handleToggleScopeTag = (tagId: string) => {
    if (!editingRole) return;
    const currentTags = editingRole.scopeTagIds || [];
    const updatedTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    setEditingRole({ ...editingRole, scopeTagIds: updatedTags });
  };

  // --- USERS MAPPING ACTIONS ---
  const handleSaveUserMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserMapping) return;

    const { user, roleIds, tagIds } = editingUserMapping;
    await dbService.saveUserRoles(user.id, roleIds);
    await dbService.saveUserTags(user.id, tagIds);

    setEditingUserMapping(null);
    await loadAllData();
    await refreshAuthData();
  };

  const handleUserToggleRole = (roleId: string) => {
    if (!editingUserMapping) return;
    const currentRoles = editingUserMapping.roleIds;
    const updatedRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(id => id !== roleId)
      : [...currentRoles, roleId];
    setEditingUserMapping({ ...editingUserMapping, roleIds: updatedRoles });
  };

  const handleUserToggleTag = (tagId: string) => {
    if (!editingUserMapping) return;
    const currentTags = editingUserMapping.tagIds;
    const updatedTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    setEditingUserMapping({ ...editingUserMapping, tagIds: updatedTags });
  };

  // --- FORUMS ACTIONS ---
  const handleSaveForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForum || !editingForum.name?.trim()) return;

    const forumPayload = {
      name: editingForum.name.trim(),
      description: editingForum.description || '',
      type: editingForum.type || 'team',
      tagId: editingForum.type === 'team' || editingForum.type === 'subject' ? editingForum.tagId || null : null,
      managerRoleIds: editingForum.managerRoleIds || []
    };

    if (editingForum.id) {
      await dbService.updateForum(editingForum.id, forumPayload);
    } else {
      await dbService.createForum(forumPayload);
    }

    setEditingForum(null);
    await loadAllData();
  };

  const handleToggleForumManagerRole = (roleId: string) => {
    if (!editingForum) return;
    const currentManagers = editingForum.managerRoleIds || [];
    const updatedManagers = currentManagers.includes(roleId)
      ? currentManagers.filter(id => id !== roleId)
      : [...currentManagers, roleId];
    setEditingForum({ ...editingForum, managerRoleIds: updatedManagers });
  };

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '8px' }}>ניהול מערכת</h1>
      <p className="text-muted" style={{ marginBottom: '24px' }}>
        כאן ניתן להגדיר קבוצות, תפקידים, הרשאות, שיוך משתמשים ופורומים דינמיים.
      </p>

      {/* Tabs list */}
      <div className="tabs-container" style={tabsContainerStyle}>
        <button 
          onClick={() => { setActiveTab('tags'); setEditingTag(null); }} 
          style={activeTab === 'tags' ? activeTabBtnStyle : tabBtnStyle}
        >
          <Users size={16} />
          קבוצות ותגיות ({tags.length})
        </button>
        <button 
          onClick={() => { setActiveTab('roles'); setEditingRole(null); }} 
          style={activeTab === 'roles' ? activeTabBtnStyle : tabBtnStyle}
        >
          <Settings size={16} />
          תפקידים והרשאות ({roles.length})
        </button>
        <button 
          onClick={() => { setActiveTab('users'); setEditingUserMapping(null); }} 
          style={activeTab === 'users' ? activeTabBtnStyle : tabBtnStyle}
        >
          <Users size={16} />
          שיוך משתמשים ({users.length})
        </button>
        <button 
          onClick={() => { setActiveTab('forums'); setEditingForum(null); }} 
          style={activeTab === 'forums' ? activeTabBtnStyle : tabBtnStyle}
        >
          <MessageSquare size={16} />
          ניהול פורומים ({forums.length})
        </button>
      </div>

      {/* --- TAB 1: TAGS PANEL --- */}
      {activeTab === 'tags' && (
        <div className="admin-grid">
          {/* List panel */}
          <div className="admin-list">
            <h2>קבוצות ותגיות קיימות</h2>
            <div className="admin-scroll-list" style={scrollListStyle}>
              {tags.map(tag => (
                <div key={tag.id} className="card" style={itemCardStyle}>
                  <div>
                    <span style={itemTitleStyle}>{tag.name}</span>
                    <div style={itemSubtitleStyle}>קטגוריה: {tag.category === 'team' ? 'צוות' : tag.category === 'major' ? 'מגמה' : 'מיוחד'}</div>
                  </div>
                  <button 
                    onClick={() => setEditingTag(tag)} 
                    className="btn btn-secondary" 
                    style={editBtnStyle}
                  >
                    <Edit size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Edit panel */}
          <div className="card admin-form">
            <h2>{editingTag?.id ? 'ערוך תגית' : 'צור תגית חדשה'}</h2>
            <form onSubmit={handleSaveTag} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">שם התגית / קבוצה *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="לדוגמה: צוות 9, דוברי אנגלית..."
                  value={editingTag?.name || ''}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">קטגוריה *</label>
                <select
                  className="form-control"
                  value={editingTag?.category || 'team'}
                  onChange={(e) => setEditingTag({ ...editingTag, category: e.target.value as any })}
                >
                  <option value="team">צוות (Team)</option>
                  <option value="major">מגמה (Major)</option>
                  <option value="special">מיוחד (Special/Other)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={16} />
                  שמור תגית
                </button>
                {editingTag && (
                  <button type="button" onClick={() => setEditingTag(null)} className="btn btn-secondary">
                    ביטול
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 2: ROLES & SCOPES PANEL --- */}
      {activeTab === 'roles' && (
        <div className="admin-grid">
          {/* List panel */}
          <div className="admin-list">
            <h2>תפקידים קיימים</h2>
            <div className="admin-scroll-list" style={scrollListStyle}>
              {roles.map(role => (
                <div key={role.id} className="card" style={itemCardStyle}>
                  <div>
                    <span style={itemTitleStyle}>{role.name}</span>
                    <div style={itemSubtitleStyle}>
                      טווח אחריות: {role.scopeType === 'all' ? 'כלל המשתמשים' : role.scopeType === 'tags' ? `${role.scopeTagIds?.length || 0} קבוצות` : `${role.scopeUserIds?.length || 0} משתמשים`}
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingRole(role)} 
                    className="btn btn-secondary" 
                    style={editBtnStyle}
                  >
                    <Edit size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Edit panel */}
          <div className="card admin-form">
            <h2>{editingRole?.id ? 'ערוך תפקיד' : 'צור תפקיד חדש'}</h2>
            <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">שם התפקיד *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="לדוגמה: ממ״ש צוות 8, קצין הדרכה..."
                  value={editingRole?.name || ''}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                />
              </div>

              {/* Permissions checklist */}
              <div className="form-group">
                <label className="form-label">הרשאות מוגדרות לתפקיד</label>
                <div style={checkboxGridStyle}>
                  {[
                    { key: 'canPublishTasks', label: 'פרסום משימות' },
                    { key: 'canTrackTaskCompletion', label: 'מעקב אחר ביצוע משימות' },
                    { key: 'canManageForums', label: 'ניהול ופרסום בפורומים' },
                    { key: 'canCreateForums', label: 'יצירת פורומים חדשים' },
                    { key: 'canManageUsers', label: 'ניהול שיוכי משתמשים' },
                    { key: 'canManageRoles', label: 'ניהול והקצאת תפקידים' },
                    { key: 'canManageTags', label: 'ניהול קבוצות ותגיות' },
                  ].map(item => {
                    const isChecked = (editingRole?.permissions || []).includes(item.key);
                    return (
                      <label key={item.key} style={checkboxItemStyle}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(item.key)}
                          style={{ marginLeft: '8px' }}
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scope definitions */}
              <div className="form-group" style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '16px' }}>
                <label className="form-label">סוג טווח אחריות (Scope) *</label>
                <select
                  className="form-control"
                  value={editingRole?.scopeType || 'tags'}
                  onChange={(e) => setEditingRole({ ...editingRole, scopeType: e.target.value as any, scopeTagIds: [], scopeUserIds: [] })}
                >
                  <option value="all">כל המשתמשים במערכת (Scope רחב)</option>
                  <option value="tags">לפי קבוצות / תגיות שיוך</option>
                  <option value="users">לפי משתמשים ספציפיים ידנית</option>
                </select>
              </div>

              {/* Scope Tags picker */}
              {editingRole?.scopeType === 'tags' && (
                <div className="form-group">
                  <label className="form-label">בחר קבוצות בטווח האחריות:</label>
                  <div style={checkboxGridStyle}>
                    {tags.map(tag => {
                      const isChecked = (editingRole?.scopeTagIds || []).includes(tag.id);
                      return (
                        <label key={tag.id} style={checkboxItemStyle}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleScopeTag(tag.id)}
                            style={{ marginLeft: '8px' }}
                          />
                          {tag.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={16} />
                  שמור תפקיד
                </button>
                {editingRole && (
                  <button type="button" onClick={() => setEditingRole(null)} className="btn btn-secondary">
                    ביטול
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 3: USER MAPPINGS PANEL --- */}
      {activeTab === 'users' && (
        <div className="admin-grid">
          {/* List panel */}
          <div className="admin-list">
            <h2>משתמשי המערכת</h2>
            <div className="admin-scroll-list" style={scrollListStyle}>
              {users.map(user => {
                const myRoleIds = userRoles.filter(ur => ur.userId === user.id).map(ur => ur.roleId);
                const myTagIds = userTags.filter(ut => ut.userId === user.id).map(ut => ut.tagId);
                const myRoles = roles.filter(r => myRoleIds.includes(r.id)).map(r => r.name);
                const myGroups = tags.filter(t => myTagIds.includes(t.id)).map(t => t.name);

                return (
                  <div key={user.id} className="card" style={{ ...itemCardStyle, flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800 }}>{user.name}</span>
                      <button 
                        onClick={() => setEditingUserMapping({
                          user,
                          roleIds: myRoleIds,
                          tagIds: myTagIds
                        })} 
                        className="btn btn-secondary" 
                        style={editBtnStyle}
                      >
                        <Edit size={14} />
                        שנה שיוכים
                      </button>
                    </div>

                    <div style={userMappingLabelsRowStyle}>
                      <div>תפקידים: {myRoles.join(', ') || 'משתמש רגיל'}</div>
                      <div>קבוצות: {myGroups.join(', ') || 'ללא קבוצה'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit panel */}
          {editingUserMapping ? (
            <div className="card admin-form">
              <h2>ערוך שיוכים עבור: {editingUserMapping.user.name}</h2>
              <form onSubmit={handleSaveUserMapping} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                
                {/* Roles list */}
                <div className="form-group">
                  <label className="form-label">הקצה תפקידים במערכת</label>
                  <div style={checkboxGridStyle}>
                    {roles.map(role => {
                      const isChecked = editingUserMapping.roleIds.includes(role.id);
                      return (
                        <label key={role.id} style={checkboxItemStyle}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleUserToggleRole(role.id)}
                            style={{ marginLeft: '8px' }}
                          />
                          {role.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Tags list */}
                <div className="form-group">
                  <label className="form-label">שיוך לקבוצות (קובע משימות ופורומים שיחשפו בפניו)</label>
                  <div style={checkboxGridStyle}>
                    {tags.map(tag => {
                      const isChecked = editingUserMapping.tagIds.includes(tag.id);
                      return (
                        <label key={tag.id} style={checkboxItemStyle}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleUserToggleTag(tag.id)}
                            style={{ marginLeft: '8px' }}
                          />
                          {tag.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <Save size={16} />
                    שמור שיוכים
                  </button>
                  <button type="button" onClick={() => setEditingUserMapping(null)} className="btn btn-secondary">
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card admin-form">
              <div style={emptyCardStyle}>
                <ShieldAlert size={32} color="var(--outline)" />
                <div>אנא בחר משתמש מרשימת המשתמשים כדי לערוך את תפקידיו וקבוצותיו.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: FORUMS PANEL --- */}
      {activeTab === 'forums' && (
        <div className="admin-grid">
          {/* List panel */}
          <div className="admin-list">
            <h2>פורומים קיימים</h2>
            <div className="admin-scroll-list" style={scrollListStyle}>
              {forums.map(forum => {
                const assocTag = tags.find(t => t.id === forum.tagId);
                const managerRoles = roles.filter(r => forum.managerRoleIds.includes(r.id)).map(r => r.name);
                
                return (
                  <div key={forum.id} className="card" style={itemCardStyle}>
                    <div>
                      <span style={itemTitleStyle}>{forum.name}</span>
                      <div style={itemSubtitleStyle}>שיוך קבוצתי: {assocTag ? assocTag.name : 'כללי'}</div>
                      <div style={itemSubtitleStyle}>מנהלים: {managerRoles.join(', ') || 'מה״מ'}</div>
                    </div>
                    <button 
                      onClick={() => setEditingForum(forum)} 
                      className="btn btn-secondary" 
                      style={editBtnStyle}
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit panel */}
          <div className="card admin-form">
            <h2>{editingForum?.id ? 'ערוך פורום' : 'צור פורום חדש'}</h2>
            <form onSubmit={handleSaveForum} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">שם הפורום *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="לדוגמה: פורום צוות 9, פורום פיתוח..."
                  value={editingForum?.name || ''}
                  onChange={(e) => setEditingForum({ ...editingForum, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">תיאור הפורום</label>
                <textarea
                  className="form-control"
                  placeholder="תאר את נושאי הדיון בפורום זה..."
                  rows={2}
                  value={editingForum?.description || ''}
                  onChange={(e) => setEditingForum({ ...editingForum, description: e.target.value })}
                />
              </div>

              <div style={formRowStyle}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">סוג פורום *</label>
                  <select
                    className="form-control"
                    value={editingForum?.type || 'team'}
                    onChange={(e) => setEditingForum({ ...editingForum, type: e.target.value as any, tagId: null })}
                  >
                    <option value="team">צוותי (מקושר לקבוצה)</option>
                    <option value="subject">תחומי (גלוי לקבוצות מוגדרות)</option>
                    <option value="general">כללי (גלוי לכולם)</option>
                  </select>
                </div>

                {editingForum?.type !== 'general' && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">קבוצת שיוך גלויה *</label>
                    <select
                      className="form-control"
                      value={editingForum?.tagId || ''}
                      onChange={(e) => setEditingForum({ ...editingForum, tagId: e.target.value })}
                    >
                      <option value="">בחר קבוצה...</option>
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Forum managers list */}
              <div className="form-group">
                <label className="form-label">תפקידים מורשים לניהול הפורום (פרסום הודעות/משימות)</label>
                <div style={checkboxGridStyle}>
                  {roles.map(role => {
                    const isChecked = (editingForum?.managerRoleIds || []).includes(role.id);
                    return (
                      <label key={role.id} style={checkboxItemStyle}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleForumManagerRole(role.id)}
                          style={{ marginLeft: '8px' }}
                        />
                        {role.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={16} />
                  שמור פורום
                </button>
                {editingForum && (
                  <button type="button" onClick={() => setEditingForum(null)} className="btn btn-secondary">
                    ביטול
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
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

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginBottom: '24px',
  borderBottom: '1px solid var(--outline-variant)',
  paddingBottom: '8px'
};

const tabBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  border: 'none',
  background: 'none',
  color: 'var(--on-surface-variant)',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
  borderRadius: 'var(--rounded-md)',
  transition: 'background-color 0.2s ease, color 0.2s ease',
  minHeight: '40px'
};

const activeTabBtnStyle: React.CSSProperties = {
  ...tabBtnStyle,
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)',
};



const scrollListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingRight: '4px',
  marginTop: '16px'
};

const itemCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  marginBottom: 0
};

const itemTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '1rem',
  color: 'var(--on-surface)'
};

const itemSubtitleStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--outline)',
  marginTop: '2px'
};

const editBtnStyle: React.CSSProperties = {
  minHeight: '32px',
  width: '32px',
  padding: 0
};



const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap'
};

const checkboxGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
  gap: '8px',
  marginTop: '8px',
  backgroundColor: 'var(--background)',
  padding: '16px',
  borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--outline-variant)'
};

const checkboxItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: 'var(--on-surface)',
  cursor: 'pointer'
};

const userMappingLabelsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  fontSize: '0.8rem',
  color: 'var(--on-surface-variant)',
  borderTop: '1px solid var(--surface-container-high)',
  paddingTop: '8px',
  flexWrap: 'wrap'
};

const emptyCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-container-low)',
  borderRadius: 'var(--rounded-xl)',
  border: '1px dotted var(--outline)',
  padding: '60px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  color: 'var(--on-surface-variant)',
  textAlign: 'center',
  fontSize: '0.9rem'
};
