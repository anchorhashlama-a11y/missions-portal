import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import type { User, Role, Tag, UserRole, UserTag } from '../types';
import { dbService } from '../services/db';

interface AuthContextType {
  currentUser: User | null;
  activeRole: Role | null;
  userRoles: Role[];
  userTags: Tag[];
  testUsers: User[];
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (roleId: string) => void;
  refreshAuthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [testUsers, setTestUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;

    const init = async () => {
      if (auth) {
        unsubscribeAuth = auth.onAuthStateChanged(async (fbUser) => {
          if (fbUser && fbUser.email) {
            const dbUsers = await dbService.getUsers();
            setTestUsers(dbUsers);
            let user = dbUsers.find(u => u.email === fbUser.email);

            if (!user) {
              const newUser: User = {
                id: 'user_' + fbUser.uid,
                name: fbUser.displayName || fbUser.email.split('@')[0],
                email: fbUser.email,
                avatar: fbUser.photoURL || undefined
              };
              await dbService.saveUser(newUser);
              await dbService.saveUserRoles(newUser.id, ['role_regular']);
              await dbService.saveUserTags(newUser.id, ['tag_team8', 'tag_major_sw']);
              const updatedUsers = await dbService.getUsers();
              setTestUsers(updatedUsers);
              user = newUser;
              await loadUserSession(user, updatedUsers);
            } else {
              await loadUserSession(user, dbUsers);
            }
          } else {
            setCurrentUser(null);
            setActiveRole(null);
            setUserRoles([]);
            setUserTags([]);
          }
          setLoading(false);
        });
      }
    };

    init();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const loadUserSession = async (user: User, allUsersList: User[]) => {
    setCurrentUser(user);
    localStorage.setItem('protask_session_uid', user.id);

    const allTags = await dbService.getTags();
    const allUserTags = await dbService.getUserTags();
    const myTagIds = allUserTags.filter(ut => ut.userId === user.id).map(ut => ut.tagId);
    const myTags = allTags.filter(t => myTagIds.includes(t.id));
    setUserTags(myTags);

    const allRoles = await dbService.getRoles();
    const allUserRoles = await dbService.getUserRoles();
    const myRoleIds = allUserRoles.filter(ur => ur.userId === user.id).map(ur => ur.roleId);
    let myRoles = allRoles.filter(r => myRoleIds.includes(r.id));

    myRoles = myRoles.map(role => {
      if (role.id === 'role_regular') {
        return {
          ...role,
          scopeUserIds: [user.id]
        };
      }
      return role;
    });

    setUserRoles(myRoles);

    const savedRoleId = localStorage.getItem(`protask_active_role_${user.id}`);
    const active = myRoles.find(r => r.id === savedRoleId) || myRoles[0] || null;
    setActiveRole(active);
  };

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      alert("חיבור Firebase אינו מוגדר.");
      return;
    }
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Auth login failed:", error);
      alert("ההתחברות נכשלה. אנא נסה שנית.");
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('protask_session_uid');

    if (auth) {
      await fbSignOut(auth);
    }
  };

  const switchRole = (roleId: string) => {
    const role = userRoles.find(r => r.id === roleId) || null;
    if (role && currentUser) {
      setActiveRole(role);
      localStorage.setItem(`protask_active_role_${currentUser.id}`, roleId);
    }
  };

  const refreshAuthData = async () => {
    if (currentUser) {
      const users = await dbService.getUsers();
      setTestUsers(users);
      const reloadedUser = users.find(u => u.id === currentUser.id) || currentUser;
      await loadUserSession(reloadedUser, users);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      activeRole,
      userRoles,
      userTags,
      testUsers,
      loading,
      loginWithGoogle,
      logout,
      switchRole,
      refreshAuthData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
