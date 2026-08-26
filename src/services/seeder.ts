import type { User, Tag, Role, Task, Forum, ForumPost, TaskStatus, UserRole, UserTag } from '../types';

export const SEED_TAGS: Tag[] = [
  { id: 'tag_team6', name: 'צוות 6', category: 'team' },
  { id: 'tag_team7', name: 'צוות 7', category: 'team' },
  { id: 'tag_team8', name: 'צוות 8', category: 'team' },
  { id: 'tag_major_sw', name: 'מגמת תוכנה', category: 'major' },
  { id: 'tag_exp_a', name: 'התנסות א\'', category: 'special' },
  { id: 'tag_staff', name: 'סגל', category: 'special' },
  { id: 'tag_religious', name: 'דתיים', category: 'special' }
];

export const SEED_USERS: User[] = [
  { id: 'user_noa', name: 'נועה', email: 'noa@protask.io', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 'user_daniel', name: 'דניאל', email: 'daniel@protask.io', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: 'user_yuval', name: 'יובל', email: 'yuval@protask.io', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { id: 'user_maya', name: 'מאיה', email: 'maya@protask.io', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
  { id: 'user_roni', name: 'רוני (ממ״ש)', email: 'roni@protask.io', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  { id: 'user_alon', name: 'אלון (קפ״מ)', email: 'alon@protask.io', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' },
  { id: 'user_meir', name: 'מאיר (מה״מ)', email: 'meir@protask.io', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150' },
  { id: 'user_sara', name: 'שרה (דת)', email: 'sara@protask.io', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { id: 'user_avi', name: 'אבי (AI)', email: 'avi@protask.io', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' }
];

export const SEED_USER_TAGS: UserTag[] = [
  // Noa: Team 8, Major SW
  { userId: 'user_noa', tagId: 'tag_team8' },
  { userId: 'user_noa', tagId: 'tag_major_sw' },
  
  // Daniel: Team 7, Major SW, Religious
  { userId: 'user_daniel', tagId: 'tag_team7' },
  { userId: 'user_daniel', tagId: 'tag_major_sw' },
  { userId: 'user_daniel', tagId: 'tag_religious' },

  // Yuval: Team 8, Major SW
  { userId: 'user_yuval', tagId: 'tag_team8' },
  { userId: 'user_yuval', tagId: 'tag_major_sw' },

  // Maya: Team 8, Major SW
  { userId: 'user_maya', tagId: 'tag_team8' },
  { userId: 'user_maya', tagId: 'tag_major_sw' },

  // Roni: Team 8, Staff
  { userId: 'user_roni', tagId: 'tag_team8' },
  { userId: 'user_roni', tagId: 'tag_staff' },

  // Alon: Staff, Major SW
  { userId: 'user_alon', tagId: 'tag_staff' },
  { userId: 'user_alon', tagId: 'tag_major_sw' },

  // Meir: Staff
  { userId: 'user_meir', tagId: 'tag_staff' },

  // Sara: Team 7, Staff, Religious
  { userId: 'user_sara', tagId: 'tag_team7' },
  { userId: 'user_sara', tagId: 'tag_staff' },
  { userId: 'user_sara', tagId: 'tag_religious' },

  // Avi: Team 6, Major SW
  { userId: 'user_avi', tagId: 'tag_team6' },
  { userId: 'user_avi', tagId: 'tag_major_sw' }
];

export const SEED_ROLES: Role[] = [
  {
    id: 'role_mamesh_t8',
    name: 'ממ״ש צוות 8',
    permissions: ['canPublishTasks', 'canTrackTaskCompletion', 'canManageForums'],
    scopeType: 'tags',
    scopeTagIds: ['tag_team8']
  },
  {
    id: 'role_kapam_sw',
    name: 'קפ״מ מגמה א\'',
    permissions: ['canPublishTasks', 'canTrackTaskCompletion'],
    scopeType: 'tags',
    scopeTagIds: ['tag_major_sw']
  },
  {
    id: 'role_maham',
    name: 'מה״מ',
    permissions: ['canPublishTasks', 'canTrackTaskCompletion', 'canManageForums', 'canCreateForums', 'canManageUsers', 'canManageRoles', 'canManageTags'],
    scopeType: 'all'
  },
  {
    id: 'role_religion_officer',
    name: 'קצין דת',
    permissions: ['canPublishTasks', 'canManageForums'],
    scopeType: 'tags',
    scopeTagIds: ['tag_religious']
  },
  {
    id: 'role_ai_lead',
    name: 'מוביל AI',
    permissions: ['canPublishTasks', 'canManageForums'],
    scopeType: 'tags',
    scopeTagIds: ['tag_major_sw']
  },
  {
    id: 'role_regular',
    name: 'משתמש רגיל',
    permissions: [],
    scopeType: 'users',
    scopeUserIds: [] // Dynamically set to current user id
  }
];

export const SEED_USER_ROLES: UserRole[] = [
  { userId: 'user_noa', roleId: 'role_regular' },
  { userId: 'user_daniel', roleId: 'role_regular' },
  { userId: 'user_yuval', roleId: 'role_regular' },
  { userId: 'user_maya', roleId: 'role_regular' },
  { userId: 'user_roni', roleId: 'role_mamesh_t8' },
  { userId: 'user_alon', roleId: 'role_kapam_sw' },
  { userId: 'user_meir', roleId: 'role_maham' },
  { userId: 'user_sara', roleId: 'role_religion_officer' },
  { userId: 'user_avi', roleId: 'role_ai_lead' }
];

export const SEED_FORUMS: Forum[] = [
  {
    id: 'forum_team8',
    name: 'פורום צוות 8',
    description: 'עדכונים ומשימות שוטפות של צוות 8',
    type: 'team',
    tagId: 'tag_team8',
    managerRoleIds: ['role_mamesh_t8', 'role_maham']
  },
  {
    id: 'forum_major_sw',
    name: 'פורום מגמת תוכנה',
    description: 'מגמת פיתוח תוכנה והנדסה - דיונים ועדכונים מקצועיים',
    type: 'subject',
    tagId: 'tag_major_sw',
    managerRoleIds: ['role_kapam_sw', 'role_maham']
  },
  {
    id: 'forum_general',
    name: 'פורום כללי השלמה',
    description: 'הודעות כלליות ומשימות מה״מ לכל ההשלמה',
    type: 'general',
    tagId: null,
    managerRoleIds: ['role_maham']
  }
];

// Generate dynamic ISO string offset by days
const getOffsetDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0] + 'T23:59:59Z';
};

export const SEED_TASKS: Task[] = [
  {
    id: 'task_pref_form',
    title: 'מילוי טופס העדפות תפקידי התנסות',
    description: 'עליכם למלא את העדפות השיוך שלכם לתפקידי ההתנסות הבאים לקראת סבב ב\'. שימו לב שכולם חייבים להגיש.',
    publisherId: 'user_roni',
    publisherRoleId: 'role_mamesh_t8',
    createdAt: getOffsetDate(-3),
    updatedAt: getOffsetDate(-3),
    dueDate: getOffsetDate(4),
    link: 'https://forms.google.com/example-pref',
    documents: [
      { name: 'סילבוס תפקידי התנסות.pdf', url: '#' }
    ],
    targetTagIds: ['tag_team8'],
    targetUserIds: [],
    isUrgent: false,
    version: 1
  },
  {
    id: 'task_integration_q',
    title: 'שאלון השתלבות במגמה ורפלקציה שבועית',
    description: 'נא למלא את שאלון הרפלקציה על שבוע הלמידה הראשון. השאלון מהווה בסיס לשיחות אישיות השבוע.',
    publisherId: 'user_alon',
    publisherRoleId: 'role_kapam_sw',
    createdAt: getOffsetDate(-1),
    updatedAt: getOffsetDate(-1),
    dueDate: getOffsetDate(1), // Tomorrow, makes it Urgent
    link: 'https://forms.google.com/example-reflect',
    targetTagIds: ['tag_major_sw'],
    targetUserIds: [],
    isUrgent: true,
    version: 1
  },
  {
    id: 'task_campus_guard',
    title: 'הרשמה לסבב שמירות בקמפוס',
    description: 'יש להירשם לשבצות השמירה בקובץ המשותף. מי שלא יירשם ישובץ באקראי ע״י המזכירות.',
    publisherId: 'user_meir',
    publisherRoleId: 'role_maham',
    createdAt: getOffsetDate(-5),
    updatedAt: getOffsetDate(-2), // Edited later
    dueDate: getOffsetDate(-1), // Overdue!
    link: 'https://docs.google.com/spreadsheets/example-guards',
    targetTagIds: ['tag_major_sw'], // Sent to Software Major (Noa, Daniel, Yuval, Maya, Alon, Avi)
    targetUserIds: [],
    isUrgent: false,
    version: 2
  },
  {
    id: 'task_ai_setup',
    title: 'הגדרת סביבת עבודה AI וענן',
    description: 'יש לבצע אקטיבציה לחשבונות הענן שלכם ולהגדיר את מפתח ה-API כפי שהוסבר בפרסום של מוביל ה-AI.',
    publisherId: 'user_avi',
    publisherRoleId: 'role_ai_lead',
    createdAt: getOffsetDate(-2),
    updatedAt: getOffsetDate(-2),
    dueDate: getOffsetDate(3),
    targetTagIds: ['tag_major_sw'],
    targetUserIds: [],
    isUrgent: false,
    version: 1
  }
];

export const SEED_TASK_STATUS: TaskStatus[] = [
  // task_pref_form (Team 8 task)
  // Target: Noa, Yuval, Maya (Roni is publisher)
  { id: 'status_1', taskId: 'task_pref_form', userId: 'user_noa', viewedAt: getOffsetDate(-2), completedAt: null, lastSeenVersion: 1 },
  { id: 'status_2', taskId: 'task_pref_form', userId: 'user_yuval', viewedAt: null, completedAt: null, lastSeenVersion: 1 },
  { id: 'status_3', taskId: 'task_pref_form', userId: 'user_maya', viewedAt: getOffsetDate(-1), completedAt: getOffsetDate(-1), lastSeenVersion: 1 },

  // task_integration_q (Major SW task)
  // Target: Noa, Daniel, Yuval, Maya, Avi
  { id: 'status_4', taskId: 'task_integration_q', userId: 'user_noa', viewedAt: getOffsetDate(-1), completedAt: null, lastSeenVersion: 1 },
  { id: 'status_5', taskId: 'task_integration_q', userId: 'user_daniel', viewedAt: null, completedAt: null, lastSeenVersion: 1 },
  { id: 'status_6', taskId: 'task_integration_q', userId: 'user_yuval', viewedAt: getOffsetDate(-1), completedAt: getOffsetDate(-1), lastSeenVersion: 1 },
  { id: 'status_7', taskId: 'task_integration_q', userId: 'user_maya', viewedAt: null, completedAt: null, lastSeenVersion: 1 },
  { id: 'status_8', taskId: 'task_integration_q', userId: 'user_avi', viewedAt: getOffsetDate(-1), completedAt: getOffsetDate(-1), lastSeenVersion: 1 },

  // task_campus_guard (Major SW task, overdue, version 2)
  { id: 'status_9', taskId: 'task_campus_guard', userId: 'user_noa', viewedAt: getOffsetDate(-4), completedAt: null, lastSeenVersion: 1 }, // Noa saw version 1, hasn't seen version 2 ("Updated" state!)
  { id: 'status_10', taskId: 'task_campus_guard', userId: 'user_daniel', viewedAt: getOffsetDate(-3), completedAt: getOffsetDate(-2), lastSeenVersion: 2 },
  { id: 'status_11', taskId: 'task_campus_guard', userId: 'user_yuval', viewedAt: null, completedAt: null, lastSeenVersion: 2 },
  { id: 'status_12', taskId: 'task_campus_guard', userId: 'user_maya', viewedAt: getOffsetDate(-2), completedAt: getOffsetDate(-2), lastSeenVersion: 2 },
  { id: 'status_13', taskId: 'task_campus_guard', userId: 'user_avi', viewedAt: null, completedAt: null, lastSeenVersion: 2 }
];

export const SEED_POSTS: ForumPost[] = [
  // General forum posts
  {
    id: 'post_1',
    forumId: 'forum_general',
    publisherId: 'user_meir',
    publisherRoleId: 'role_maham',
    createdAt: getOffsetDate(-5),
    type: 'message',
    content: 'שלום לכל חברי ההשלמה! ברוכים הבאים לפורטל המשימות והפורומים הרשמי שלנו. בפורום זה יתפרסמו הודעות כלליות מטעם הסגל. בהצלחה!',
    taskId: null
  },
  {
    id: 'post_2',
    forumId: 'forum_general',
    publisherId: 'user_meir',
    publisherRoleId: 'role_maham',
    createdAt: getOffsetDate(-5),
    type: 'task',
    content: 'משימה כללית חדשה לכל ההשלמה - הרשמה לסבב שמירות בקמפוס.',
    taskId: 'task_campus_guard'
  },
  
  // Team 8 posts
  {
    id: 'post_3',
    forumId: 'forum_team8',
    publisherId: 'user_roni',
    publisherRoleId: 'role_mamesh_t8',
    createdAt: getOffsetDate(-3),
    type: 'message',
    content: 'היי צוות 8, תזכורת: ביום שלישי הקרוב יש לנו מסדר בוקר מוקדם בשעה 07:30. נא להגיע מדוגמים ומלאי אנרגיה!',
    taskId: null
  },
  {
    id: 'post_4',
    forumId: 'forum_team8',
    publisherId: 'user_roni',
    publisherRoleId: 'role_mamesh_t8',
    createdAt: getOffsetDate(-3),
    type: 'task',
    content: 'משימה חדשה לצוות 8: הגשת העדפות לתפקידי ההתנסות.',
    taskId: 'task_pref_form'
  },

  // Major SW posts
  {
    id: 'post_5',
    forumId: 'forum_major_sw',
    publisherId: 'user_alon',
    publisherRoleId: 'role_kapam_sw',
    createdAt: getOffsetDate(-1),
    type: 'task',
    content: 'משימה למגמת תוכנה: מילוי שאלון השתלבות שבועי.',
    taskId: 'task_integration_q'
  },
  {
    id: 'post_6',
    forumId: 'forum_major_sw',
    publisherId: 'user_avi',
    publisherRoleId: 'role_ai_lead',
    createdAt: getOffsetDate(-2),
    type: 'task',
    content: 'בבקשה להשלים את הגדרת מפתח ה-API לענן לקראת התרגיל המעשי מחר.',
    taskId: 'task_ai_setup'
  }
];
