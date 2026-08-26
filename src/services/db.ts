import { db as firestoreDb, isFirebaseEnabled } from '../firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import type { User, Tag, Role, Task, Forum, ForumPost, TaskStatus, UserRole, UserTag } from '../types';
import * as seeder from './seeder';

// Local storage key names
const KEYS = {
  USERS: 'protask_users',
  TAGS: 'protask_tags',
  USER_TAGS: 'protask_user_tags',
  ROLES: 'protask_roles',
  USER_ROLES: 'protask_user_roles',
  TASKS: 'protask_tasks',
  TASK_STATUS: 'protask_task_status',
  FORUMS: 'protask_forums',
  POSTS: 'protask_posts'
};

// In-memory fallback database state
class LocalDb {
  private get<T>(key: string, fallback: T[]): T[] {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(val);
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getUsers() { return this.get<User>(KEYS.USERS, seeder.SEED_USERS); }
  setUsers(data: User[]) { this.set(KEYS.USERS, data); }

  getTags() { return this.get<Tag>(KEYS.TAGS, seeder.SEED_TAGS); }
  setTags(data: Tag[]) { this.set(KEYS.TAGS, data); }

  getUserTags() { return this.get<UserTag>(KEYS.USER_TAGS, seeder.SEED_USER_TAGS); }
  setUserTags(data: UserTag[]) { this.set(KEYS.USER_TAGS, data); }

  getRoles() { return this.get<Role>(KEYS.ROLES, seeder.SEED_ROLES); }
  setRoles(data: Role[]) { this.set(KEYS.ROLES, data); }

  getUserRoles() { return this.get<UserRole>(KEYS.USER_ROLES, seeder.SEED_USER_ROLES); }
  setUserRoles(data: UserRole[]) { this.set(KEYS.USER_ROLES, data); }

  getTasks() { return this.get<Task>(KEYS.TASKS, seeder.SEED_TASKS); }
  setTasks(data: Task[]) { this.set(KEYS.TASKS, data); }

  getTaskStatuses() { return this.get<TaskStatus>(KEYS.TASK_STATUS, seeder.SEED_TASK_STATUS); }
  setTaskStatuses(data: TaskStatus[]) { this.set(KEYS.TASK_STATUS, data); }

  getForums() { return this.get<Forum>(KEYS.FORUMS, seeder.SEED_FORUMS); }
  setForums(data: Forum[]) { this.set(KEYS.FORUMS, data); }

  getPosts() { return this.get<ForumPost>(KEYS.POSTS, seeder.SEED_POSTS); }
  setPosts(data: ForumPost[]) { this.set(KEYS.POSTS, data); }

  reset() {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.TAGS);
    localStorage.removeItem(KEYS.USER_TAGS);
    localStorage.removeItem(KEYS.ROLES);
    localStorage.removeItem(KEYS.USER_ROLES);
    localStorage.removeItem(KEYS.TASKS);
    localStorage.removeItem(KEYS.TASK_STATUS);
    localStorage.removeItem(KEYS.FORUMS);
    localStorage.removeItem(KEYS.POSTS);
    console.log("Local Storage database reset to default seed data.");
  }
}

const localDb = new LocalDb();

// Unified Database API
export const dbService = {
  isOffline: !isFirebaseEnabled,

  async initialize(): Promise<void> {
    if (!isFirebaseEnabled) {
      // Running offline, LocalDb will initialize automatically when querying
      console.log("Database initialized in LocalStorage mode.");
      return;
    }

    try {
      // Check if data is seeded in Firestore. If users collection is empty, seed everything.
      const usersCol = collection(firestoreDb, 'users');
      const usersSnap = await getDocs(usersCol);
      
      if (usersSnap.empty) {
        console.log("Firestore is empty. Seeding initial data...");
        
        // Seed Users
        for (const u of seeder.SEED_USERS) {
          await setDoc(doc(firestoreDb, 'users', u.id), u);
        }
        // Seed Tags
        for (const t of seeder.SEED_TAGS) {
          await setDoc(doc(firestoreDb, 'tags', t.id), t);
        }
        // Seed UserTags
        for (const ut of seeder.SEED_USER_TAGS) {
          const id = `${ut.userId}_${ut.tagId}`;
          await setDoc(doc(firestoreDb, 'user_tags', id), ut);
        }
        // Seed Roles
        for (const r of seeder.SEED_ROLES) {
          await setDoc(doc(firestoreDb, 'roles', r.id), r);
        }
        // Seed UserRoles
        for (const ur of seeder.SEED_USER_ROLES) {
          const id = `${ur.userId}_${ur.roleId}`;
          await setDoc(doc(firestoreDb, 'user_roles', id), ur);
        }
        // Seed Forums
        for (const f of seeder.SEED_FORUMS) {
          await setDoc(doc(firestoreDb, 'forums', f.id), f);
        }
        // Seed Tasks
        for (const t of seeder.SEED_TASKS) {
          await setDoc(doc(firestoreDb, 'tasks', t.id), t);
        }
        // Seed TaskStatuses
        for (const ts of seeder.SEED_TASK_STATUS) {
          await setDoc(doc(firestoreDb, 'task_statuses', ts.id), ts);
        }
        // Seed Posts
        for (const p of seeder.SEED_POSTS) {
          await setDoc(doc(firestoreDb, 'posts', p.id), p);
        }
        console.log("Firestore seeding completed successfully.");
      } else {
        console.log("Firestore already seeded.");
      }
    } catch (error) {
      console.error("Failed to seed Firestore, switching to offline mode:", error);
      this.isOffline = true;
    }
  },

  async resetData(): Promise<void> {
    if (this.isOffline) {
      localDb.reset();
      window.location.reload();
      return;
    }
    // For safety, reset offline cache and alert that cloud database can be reset manually or we can wipe collection
    localDb.reset();
    alert("המידע המקומי אופס. לאיפוס של Firestore אנא נקה את האוספים ידנית דרך מסוף Firebase.");
    window.location.reload();
  },

  // USERS
  async getUsers(): Promise<User[]> {
    if (this.isOffline) return localDb.getUsers();
    const snap = await getDocs(collection(firestoreDb, 'users'));
    return snap.docs.map(d => d.data() as User);
  },

  async saveUser(user: User): Promise<void> {
    if (this.isOffline) {
      const users = localDb.getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) users[idx] = user;
      else users.push(user);
      localDb.setUsers(users);
      return;
    }
    await setDoc(doc(firestoreDb, 'users', user.id), user);
  },

  // TAGS
  async getTags(): Promise<Tag[]> {
    if (this.isOffline) return localDb.getTags();
    const snap = await getDocs(collection(firestoreDb, 'tags'));
    return snap.docs.map(d => d.data() as Tag);
  },

  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    const newTag: Tag = { ...tag, id: 'tag_' + Math.random().toString(36).substr(2, 9) };
    if (this.isOffline) {
      const tags = localDb.getTags();
      tags.push(newTag);
      localDb.setTags(tags);
      return newTag;
    }
    await setDoc(doc(firestoreDb, 'tags', newTag.id), newTag);
    return newTag;
  },

  async updateTag(tagId: string, tagData: Partial<Tag>): Promise<Tag> {
    if (this.isOffline) {
      const tags = localDb.getTags();
      const idx = tags.findIndex(t => t.id === tagId);
      if (idx === -1) throw new Error("Tag not found");
      tags[idx] = { ...tags[idx], ...tagData };
      localDb.setTags(tags);
      return tags[idx];
    }
    await updateDoc(doc(firestoreDb, 'tags', tagId), tagData as any);
    const snap = await getDocs(query(collection(firestoreDb, 'tags'), where('id', '==', tagId)));
    return snap.docs[0].data() as Tag;
  },

  // USER TAGS
  async getUserTags(): Promise<UserTag[]> {
    if (this.isOffline) return localDb.getUserTags();
    const snap = await getDocs(collection(firestoreDb, 'user_tags'));
    return snap.docs.map(d => d.data() as UserTag);
  },

  async saveUserTags(userId: string, tagIds: string[]): Promise<void> {
    if (this.isOffline) {
      let ut = localDb.getUserTags();
      ut = ut.filter(item => item.userId !== userId);
      tagIds.forEach(tid => ut.push({ userId, tagId: tid }));
      localDb.setUserTags(ut);
      return;
    }
    // Delete existing
    const utCol = collection(firestoreDb, 'user_tags');
    const q = query(utCol, where('userId', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    // Add new
    for (const tid of tagIds) {
      const id = `${userId}_${tid}`;
      await setDoc(doc(firestoreDb, 'user_tags', id), { userId, tagId: tid });
    }
  },

  // ROLES
  async getRoles(): Promise<Role[]> {
    if (this.isOffline) return localDb.getRoles();
    const snap = await getDocs(collection(firestoreDb, 'roles'));
    return snap.docs.map(d => d.data() as Role);
  },

  async createRole(role: Omit<Role, 'id'>): Promise<Role> {
    const newRole: Role = { ...role, id: 'role_' + Math.random().toString(36).substr(2, 9) };
    if (this.isOffline) {
      const roles = localDb.getRoles();
      roles.push(newRole);
      localDb.setRoles(roles);
      return newRole;
    }
    await setDoc(doc(firestoreDb, 'roles', newRole.id), newRole);
    return newRole;
  },

  async updateRole(roleId: string, roleData: Partial<Role>): Promise<Role> {
    if (this.isOffline) {
      const roles = localDb.getRoles();
      const idx = roles.findIndex(r => r.id === roleId);
      if (idx === -1) throw new Error("Role not found");
      roles[idx] = { ...roles[idx], ...roleData };
      localDb.setRoles(roles);
      return roles[idx];
    }
    await updateDoc(doc(firestoreDb, 'roles', roleId), roleData as any);
    const snap = await getDocs(query(collection(firestoreDb, 'roles'), where('id', '==', roleId)));
    return snap.docs[0].data() as Role;
  },

  // USER ROLES
  async getUserRoles(): Promise<UserRole[]> {
    if (this.isOffline) return localDb.getUserRoles();
    const snap = await getDocs(collection(firestoreDb, 'user_roles'));
    return snap.docs.map(d => d.data() as UserRole);
  },

  async saveUserRoles(userId: string, roleIds: string[]): Promise<void> {
    if (this.isOffline) {
      let ur = localDb.getUserRoles();
      ur = ur.filter(item => item.userId !== userId);
      roleIds.forEach(rid => ur.push({ userId, roleId: rid }));
      localDb.setUserRoles(ur);
      return;
    }
    // Delete existing
    const urCol = collection(firestoreDb, 'user_roles');
    const q = query(urCol, where('userId', '==', userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    // Add new
    for (const rid of roleIds) {
      const id = `${userId}_${rid}`;
      await setDoc(doc(firestoreDb, 'user_roles', id), { userId, roleId: rid });
    }
  },

  // TASKS
  async getTasks(): Promise<Task[]> {
    if (this.isOffline) return localDb.getTasks();
    const snap = await getDocs(collection(firestoreDb, 'tasks'));
    return snap.docs.map(d => d.data() as Task);
  },

  async getTask(taskId: string): Promise<Task | null> {
    if (this.isOffline) {
      const tasks = localDb.getTasks();
      return tasks.find(t => t.id === taskId) || null;
    }
    const snap = await getDocs(query(collection(firestoreDb, 'tasks'), where('id', '==', taskId)));
    if (snap.empty) return null;
    return snap.docs[0].data() as Task;
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    if (this.isOffline) {
      const tasks = localDb.getTasks();
      tasks.push(newTask);
      localDb.setTasks(tasks);
      return newTask;
    }
    await setDoc(doc(firestoreDb, 'tasks', newTask.id), newTask);
    return newTask;
  },

  async updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
    const now = new Date().toISOString();
    if (this.isOffline) {
      const tasks = localDb.getTasks();
      const idx = tasks.findIndex(t => t.id === taskId);
      if (idx === -1) throw new Error("Task not found");
      
      const oldTask = tasks[idx];
      tasks[idx] = { 
        ...oldTask, 
        ...taskData, 
        updatedAt: now 
      };
      
      localDb.setTasks(tasks);
      return tasks[idx];
    }
    
    await updateDoc(doc(firestoreDb, 'tasks', taskId), { ...taskData, updatedAt: now } as any);
    const snap = await getDocs(query(collection(firestoreDb, 'tasks'), where('id', '==', taskId)));
    return snap.docs[0].data() as Task;
  },

  // TASK STATUS
  async getTaskStatuses(): Promise<TaskStatus[]> {
    if (this.isOffline) return localDb.getTaskStatuses();
    const snap = await getDocs(collection(firestoreDb, 'task_statuses'));
    return snap.docs.map(d => d.data() as TaskStatus);
  },

  async getTaskStatus(taskId: string, userId: string): Promise<TaskStatus | null> {
    if (this.isOffline) {
      const statuses = localDb.getTaskStatuses();
      return statuses.find(s => s.taskId === taskId && s.userId === userId) || null;
    }
    const q = query(
      collection(firestoreDb, 'task_statuses'), 
      where('taskId', '==', taskId), 
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as TaskStatus;
  },

  async saveTaskStatus(taskId: string, userId: string, statusData: Partial<TaskStatus>): Promise<void> {
    if (this.isOffline) {
      const statuses = localDb.getTaskStatuses();
      const idx = statuses.findIndex(s => s.taskId === taskId && s.userId === userId);
      if (idx >= 0) {
        statuses[idx] = { ...statuses[idx], ...statusData };
      } else {
        const newStatus: TaskStatus = {
          id: 'status_' + Math.random().toString(36).substr(2, 9),
          taskId,
          userId,
          viewedAt: null,
          completedAt: null,
          lastSeenVersion: 1,
          ...statusData
        };
        statuses.push(newStatus);
      }
      localDb.setTaskStatuses(statuses);
      return;
    }

    const q = query(
      collection(firestoreDb, 'task_statuses'), 
      where('taskId', '==', taskId), 
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      await updateDoc(doc(firestoreDb, 'task_statuses', snap.docs[0].id), statusData as any);
    } else {
      const id = 'status_' + Math.random().toString(36).substr(2, 9);
      const newStatus: TaskStatus = {
        id,
        taskId,
        userId,
        viewedAt: null,
        completedAt: null,
        lastSeenVersion: 1,
        ...statusData
      };
      await setDoc(doc(firestoreDb, 'task_statuses', id), newStatus);
    }
  },

  // FORUMS
  async getForums(): Promise<Forum[]> {
    if (this.isOffline) return localDb.getForums();
    const snap = await getDocs(collection(firestoreDb, 'forums'));
    return snap.docs.map(d => d.data() as Forum);
  },

  async createForum(forum: Omit<Forum, 'id'>): Promise<Forum> {
    const newForum: Forum = {
      ...forum,
      id: 'forum_' + Math.random().toString(36).substr(2, 9)
    };
    if (this.isOffline) {
      const forums = localDb.getForums();
      forums.push(newForum);
      localDb.setForums(forums);
      return newForum;
    }
    await setDoc(doc(firestoreDb, 'forums', newForum.id), newForum);
    return newForum;
  },

  async updateForum(forumId: string, forumData: Partial<Forum>): Promise<Forum> {
    if (this.isOffline) {
      const forums = localDb.getForums();
      const idx = forums.findIndex(f => f.id === forumId);
      if (idx === -1) throw new Error("Forum not found");
      forums[idx] = { ...forums[idx], ...forumData };
      localDb.setForums(forums);
      return forums[idx];
    }
    await updateDoc(doc(firestoreDb, 'forums', forumId), forumData as any);
    const snap = await getDocs(query(collection(firestoreDb, 'forums'), where('id', '==', forumId)));
    return snap.docs[0].data() as Forum;
  },

  // FORUM POSTS (FEED)
  async getForumPosts(forumId: string): Promise<ForumPost[]> {
    if (this.isOffline) {
      const posts = localDb.getPosts();
      return posts.filter(p => p.forumId === forumId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
    const q = query(collection(firestoreDb, 'posts'), where('forumId', '==', forumId));
    const snap = await getDocs(q);
    const posts = snap.docs.map(d => d.data() as ForumPost);
    return posts.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createForumPost(post: Omit<ForumPost, 'id' | 'createdAt'>): Promise<ForumPost> {
    const newPost: ForumPost = {
      ...post,
      id: 'post_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    if (this.isOffline) {
      const posts = localDb.getPosts();
      posts.push(newPost);
      localDb.setPosts(posts);
      return newPost;
    }
    await setDoc(doc(firestoreDb, 'posts', newPost.id), newPost);
    return newPost;
  }
};
