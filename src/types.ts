export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Tag {
  id: string;
  name: string;
  category: 'team' | 'major' | 'special';
}

export interface UserTag {
  userId: string;
  tagId: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[]; // e.g. canPublishTasks, canTrackTaskCompletion, canManageForums, canCreateForums, canManageUsers, canManageRoles, canManageTags
  scopeType: 'all' | 'tags' | 'users';
  scopeTagIds?: string[];
  scopeUserIds?: string[];
}

export interface UserRole {
  userId: string;
  roleId: string;
}

export interface TaskDocument {
  name: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  publisherId: string;
  publisherRoleId: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  link?: string;
  linkText?: string;
  documents?: TaskDocument[];
  targetTagIds: string[]; // targets specific groups
  targetUserIds: string[]; // targets specific users
  isUrgent?: boolean;
  version: number;
}

export interface TaskStatus {
  id: string;
  taskId: string;
  userId: string;
  viewedAt: string | null;
  completedAt: string | null;
  lastSeenVersion: number;
}

export interface Forum {
  id: string;
  name: string;
  description: string;
  type: 'team' | 'subject' | 'general';
  tagId: string | null; // null if general/subject-based, or points to tagId if team restricted
  managerRoleIds: string[];
}

export interface ForumPost {
  id: string;
  forumId: string;
  publisherId: string;
  publisherRoleId: string;
  createdAt: string;
  type: 'message' | 'task';
  content: string;
  taskId: string | null; // points to Task if type is 'task'
}

export interface TaskHistory {
  id: string;
  taskId: string;
  editedBy: string;
  editedAt: string;
  fieldsChanged: string[];
  oldValues: Partial<Task>;
  newValues: Partial<Task>;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  userId: string;      // המשתמש שצריך לקבל את ההתראה
  sentAt: string;      // מתי נשלחה
  seenAt: string | null; // null עד שהמשתמש ראה אותה
}
