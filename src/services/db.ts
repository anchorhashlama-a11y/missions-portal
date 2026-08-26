import { db as firestoreDb } from '../firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import type { User, Tag, Role, Task, Forum, ForumPost, TaskStatus, UserRole, UserTag } from '../types';
import * as seeder from './seeder';

// Unified Database API
export const dbService = {
  async initialize(): Promise<void> {
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
      console.error("Firestore initialization failed:", error);
      throw error;
    }
  },

  async resetData(): Promise<void> {
    alert("לאיפוס של Firestore אנא נקה את האוספים ידנית דרך מסוף Firebase.");
  },

  // USERS
  async getUsers(): Promise<User[]> {
    const snap = await getDocs(collection(firestoreDb, 'users'));
    return snap.docs.map(d => d.data() as User);
  },

  async saveUser(user: User): Promise<void> {
    await setDoc(doc(firestoreDb, 'users', user.id), user);
  },

  // TAGS
  async getTags(): Promise<Tag[]> {
    const snap = await getDocs(collection(firestoreDb, 'tags'));
    return snap.docs.map(d => d.data() as Tag);
  },

  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    const newTag: Tag = { ...tag, id: 'tag_' + Math.random().toString(36).substr(2, 9) };
    await setDoc(doc(firestoreDb, 'tags', newTag.id), newTag);
    return newTag;
  },

  async updateTag(tagId: string, tagData: Partial<Tag>): Promise<Tag> {
    await updateDoc(doc(firestoreDb, 'tags', tagId), tagData as any);
    const snap = await getDocs(query(collection(firestoreDb, 'tags'), where('id', '==', tagId)));
    return snap.docs[0].data() as Tag;
  },

  // USER TAGS
  async getUserTags(): Promise<UserTag[]> {
    const snap = await getDocs(collection(firestoreDb, 'user_tags'));
    return snap.docs.map(d => d.data() as UserTag);
  },

  async saveUserTags(userId: string, tagIds: string[]): Promise<void> {
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
    const snap = await getDocs(collection(firestoreDb, 'roles'));
    return snap.docs.map(d => d.data() as Role);
  },

  async createRole(role: Omit<Role, 'id'>): Promise<Role> {
    const newRole: Role = { ...role, id: 'role_' + Math.random().toString(36).substr(2, 9) };
    await setDoc(doc(firestoreDb, 'roles', newRole.id), newRole);
    return newRole;
  },

  async updateRole(roleId: string, roleData: Partial<Role>): Promise<Role> {
    await updateDoc(doc(firestoreDb, 'roles', roleId), roleData as any);
    const snap = await getDocs(query(collection(firestoreDb, 'roles'), where('id', '==', roleId)));
    return snap.docs[0].data() as Role;
  },

  // USER ROLES
  async getUserRoles(): Promise<UserRole[]> {
    const snap = await getDocs(collection(firestoreDb, 'user_roles'));
    return snap.docs.map(d => d.data() as UserRole);
  },

  async saveUserRoles(userId: string, roleIds: string[]): Promise<void> {
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
    const snap = await getDocs(collection(firestoreDb, 'tasks'));
    return snap.docs.map(d => d.data() as Task);
  },

  async getTask(taskId: string): Promise<Task | null> {
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
    await setDoc(doc(firestoreDb, 'tasks', newTask.id), newTask);
    return newTask;
  },

  async updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
    const now = new Date().toISOString();
    await updateDoc(doc(firestoreDb, 'tasks', taskId), { ...taskData, updatedAt: now } as any);
    const snap = await getDocs(query(collection(firestoreDb, 'tasks'), where('id', '==', taskId)));
    return snap.docs[0].data() as Task;
  },

  // TASK STATUS
  async getTaskStatuses(): Promise<TaskStatus[]> {
    const snap = await getDocs(collection(firestoreDb, 'task_statuses'));
    return snap.docs.map(d => d.data() as TaskStatus);
  },

  async getTaskStatus(taskId: string, userId: string): Promise<TaskStatus | null> {
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
    const snap = await getDocs(collection(firestoreDb, 'forums'));
    return snap.docs.map(d => d.data() as Forum);
  },

  async createForum(forum: Omit<Forum, 'id'>): Promise<Forum> {
    const newForum: Forum = {
      ...forum,
      id: 'forum_' + Math.random().toString(36).substr(2, 9)
    };
    await setDoc(doc(firestoreDb, 'forums', newForum.id), newForum);
    return newForum;
  },

  async updateForum(forumId: string, forumData: Partial<Forum>): Promise<Forum> {
    await updateDoc(doc(firestoreDb, 'forums', forumId), forumData as any);
    const snap = await getDocs(query(collection(firestoreDb, 'forums'), where('id', '==', forumId)));
    return snap.docs[0].data() as Forum;
  },

  // FORUM POSTS (FEED)
  async getForumPosts(forumId: string): Promise<ForumPost[]> {
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
    await setDoc(doc(firestoreDb, 'posts', newPost.id), newPost);
    return newPost;
  }
};
