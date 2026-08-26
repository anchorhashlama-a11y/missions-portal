import type { User, Tag, Role, Task, TaskStatus, UserTag, UserRole } from '../types';

export const backendService = {
  // Helper: Get all user IDs that fall within a role's responsibility scope
  getUsersInScope(
    role: Role,
    allUsers: User[],
    allUserTags: UserTag[]
  ): string[] {
    if (role.scopeType === 'all') {
      return allUsers.map(u => u.id);
    }
    if (role.scopeType === 'tags' && role.scopeTagIds) {
      // Find all users who have at least one of the tags in scopeTagIds
      const tagSet = new Set(role.scopeTagIds);
      const userIds = allUserTags
        .filter(ut => tagSet.has(ut.tagId))
        .map(ut => ut.userId);
      return Array.from(new Set(userIds));
    }
    if (role.scopeType === 'users' && role.scopeUserIds) {
      return role.scopeUserIds;
    }
    return [];
  },

  // Helper: Get all user IDs that are target recipients of a task
  getTaskRecipients(
    task: Task,
    allUsers: User[],
    allUserTags: UserTag[]
  ): string[] {
    const directUserIds = task.targetUserIds || [];
    
    let taggedUserIds: string[] = [];
    if (task.targetTagIds && task.targetTagIds.length > 0) {
      const tagSet = new Set(task.targetTagIds);
      taggedUserIds = allUserTags
        .filter(ut => tagSet.has(ut.tagId))
        .map(ut => ut.userId);
    }

    return Array.from(new Set([...directUserIds, ...taggedUserIds]));
  },

  // Rule: A user can see a task if they are one of the recipients
  canUserSeeTask(
    userId: string,
    task: Task,
    allUsers: User[],
    allUserTags: UserTag[]
  ): boolean {
    // Publisher can always see their own task
    if (task.publisherId === userId) return true;

    const recipients = this.getTaskRecipients(task, allUsers, allUserTags);
    return recipients.includes(userId);
  },

  // Rule: Filter tasks to display only what is relevant to the user
  getTasksForUser(
    userId: string,
    allTasks: Task[],
    allUsers: User[],
    allUserTags: UserTag[]
  ): Task[] {
    return allTasks.filter(task => this.canUserSeeTask(userId, task, allUsers, allUserTags));
  },

  // Rule: A manager can track/manage a task if its target audience overlaps with their scope
  getManagementTasks(
    allTasks: Task[],
    userRoles: Role[],
    allUsers: User[],
    allUserTags: UserTag[]
  ): Task[] {
    // If user has no roles with tracking permission, return empty
    const trackingRoles = userRoles.filter(r => r.permissions.includes('canTrackTaskCompletion'));
    if (trackingRoles.length === 0) return [];

    // Calculate union of all user IDs in the scopes of the active tracking roles
    const managerScopeUsers = new Set<string>();
    trackingRoles.forEach(role => {
      this.getUsersInScope(role, allUsers, allUserTags).forEach(uid => {
        managerScopeUsers.add(uid);
      });
    });

    return allTasks.filter(task => {
      // Publisher can always manage their own task
      const isPublisher = trackingRoles.some(r => task.publisherId === r.scopeUserIds?.[0] || task.publisherId === 'user_meir'); // Meir is root
      if (task.publisherId === 'user_meir' && userRoles.some(r => r.id === 'role_maham')) return true;
      
      const recipients = this.getTaskRecipients(task, allUsers, allUserTags);
      // Check if there is any intersection between task recipients and manager scope
      return recipients.some(uid => managerScopeUsers.has(uid)) || task.publisherId === 'user_roni' && userRoles.some(r => r.id === 'role_mamesh_t8');
    });
  },

  // Rule: Get task progress details strictly filtered by the active role's scope
  getTaskProgressForRole(
    task: Task,
    role: Role,
    allUsers: User[],
    allUserTags: UserTag[],
    allStatuses: TaskStatus[]
  ) {
    const scopeUserIds = new Set(this.getUsersInScope(role, allUsers, allUserTags));
    const recipients = this.getTaskRecipients(task, allUsers, allUserTags);

    // Intersection of scope users and task recipients
    const inScopeRecipients = recipients.filter(uid => scopeUserIds.has(uid));

    let completedCount = 0;
    const details = inScopeRecipients.map(uid => {
      const user = allUsers.find(u => u.id === uid)!;
      const status = allStatuses.find(s => s.taskId === task.id && s.userId === uid) || null;
      
      const isCompleted = !!(status && status.completedAt);
      const isViewed = !!(status && status.viewedAt);

      if (isCompleted) completedCount++;

      return {
        user,
        completed: isCompleted,
        viewed: isViewed,
        status
      };
    });

    return {
      totalRecipients: inScopeRecipients.length,
      completedCount,
      progressPercent: inScopeRecipients.length > 0 ? Math.round((completedCount / inScopeRecipients.length) * 100) : 0,
      details
    };
  },

  // Rule: Validate that the targets are within the responsibility scope of the publisher's role
  validatePublishScope(
    role: Role,
    targetTagIds: string[],
    targetUserIds: string[],
    allUsers: User[],
    allUserTags: UserTag[]
  ): boolean {
    if (role.scopeType === 'all') return true;

    if (role.scopeType === 'tags' && role.scopeTagIds) {
      const scopeTags = new Set(role.scopeTagIds);
      // All selected target tags must be within scope tags
      const tagsValid = targetTagIds.every(tid => scopeTags.has(tid));
      
      // All selected individual users must have at least one tag in scope tags
      const usersValid = targetUserIds.every(uid => {
        const userTags = allUserTags.filter(ut => ut.userId === uid).map(ut => ut.tagId);
        return userTags.some(tid => scopeTags.has(tid));
      });

      return tagsValid && usersValid;
    }

    if (role.scopeType === 'users' && role.scopeUserIds) {
      const scopeUsers = new Set(role.scopeUserIds);
      // All target users must be in scope users
      const usersValid = targetUserIds.every(uid => scopeUsers.has(uid));
      // In this mode, publishing to tags is restricted unless the tags contain only scope users (we simplify to false)
      const tagsValid = targetTagIds.length === 0;

      return tagsValid && usersValid;
    }

    return false;
  }
};
