import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  User as UserIcon, 
  ChevronDown, 
  ShieldAlert,
  Database
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    activeRole, 
    userRoles, 
    testUsers, 
    switchUser, 
    switchRole,
    loginWithGoogle,
    logout,
    isFirebase
  } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (document.documentElement.classList.contains('dark')) return 'dark';
    return 'light';
  });

  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleResetData = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לאפס את כל המידע לנתוני המקור? (איפוס LocalStorage)")) {
      await dbService.resetData();
    }
  };

  return (
    <header style={headerStyle}>
      {/* Mobile Brand Name */}
      <div style={brandContainerStyle}>
        <span style={mobileLogoStyle}>ע</span>
        <h1 style={brandTextStyle}>"עוגן"- מערכת ניהול ההשלמה הטכנולוגית של תקשוב</h1>
      </div>

      <div style={controlsStyle}>
        {/* Firebase Authentication Button */}
        {isFirebase ? (
          <button 
            onClick={currentUser && currentUser.id.startsWith('user_google') ? logout : loginWithGoogle} 
            style={fbAuthBtnStyle}
            title={currentUser && currentUser.id.startsWith('user_google') ? "התנתק מגוגל" : "התחבר עם גוגל"}
          >
            <UserIcon size={16} />
            <span style={hideMobileStyle}>
              {currentUser && currentUser.id.startsWith('user_google') 
                ? "התנתק" 
                : "התחבר עם גוגל"}
            </span>
          </button>
        ) : (
          <span style={offlineBadgeStyle} title="Vite environment keys are missing">
            אופליין
          </span>
        )}

        {/* Database Reset Button */}
        <button 
          onClick={handleResetData} 
          style={actionBtnStyle} 
          title="אפס נתוני מערכת למקור"
        >
          <Database size={16} />
          <span style={hideMobileStyle}>אפס נתונים</span>
        </button>

        {/* Switch User Dropdown */}
        <div style={dropdownContainerStyle}>
          <button 
            onClick={() => setShowSwitchMenu(!showSwitchMenu)} 
            style={userSwitchBtnStyle}
          >
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" style={avatarStyle} />
            ) : (
              <div style={avatarFallbackStyle}>
                <UserIcon size={14} />
              </div>
            )}
            <div style={userInfoTextStyle}>
              <span style={userNameStyle}>{currentUser?.name}</span>
              <span style={userRoleStyle}>
                {activeRole ? activeRole.name : "ללא תפקיד"}
              </span>
            </div>
            <ChevronDown size={14} style={{ marginRight: '4px' }} />
          </button>

          {showSwitchMenu && (
            <div style={switchMenuStyle}>
              <div style={menuHeaderStyle}>
                <ShieldAlert size={14} style={{ marginLeft: '6px' }} />
                בחר משתמש לבדיקה:
              </div>
              <div style={userListStyle}>
                {testUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setShowSwitchMenu(false);
                    }}
                    style={user.id === currentUser?.id ? activeUserItemStyle : userItemStyle}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" style={menuAvatarStyle} />
                    ) : (
                      <div style={menuAvatarFallbackStyle}><UserIcon size={12} /></div>
                    )}
                    <span style={{ flex: 1, textAlign: 'right' }}>{user.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Role Selector (If user has multiple roles) */}
        {userRoles.length > 1 && (
          <div style={roleSelectorContainerStyle}>
            <label style={roleLabelStyle}>תפקיד פעיל:</label>
            <select
              value={activeRole?.id || ''}
              onChange={(e) => switchRole(e.target.value)}
              style={selectStyle}
            >
              {userRoles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme} 
          style={actionBtnStyle}
          title={theme === 'light' ? "עבור למצב כהה" : "עבור למצב בהיר"}
        >
          {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

// Inline styling for header layout elements
const headerStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  borderBottom: '1px solid var(--outline-variant)',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  position: 'sticky',
  top: 0,
  zIndex: 90,
  transition: 'background-color 0.3s ease, border-color 0.3s ease'
};

const brandContainerStyle: React.CSSProperties = {
  display: 'none',
  alignItems: 'center',
  gap: '8px'
};

// Toggle brand in mobile screens (since sidebar is hidden)
const mobileLogoStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)',
  borderRadius: 'var(--rounded-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '0.9rem'
};

const brandTextStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 800,
  color: 'var(--primary)',
  margin: 0
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginRight: 'auto'
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--outline-variant)',
  backgroundColor: 'var(--surface-container-low)',
  color: 'var(--on-surface)',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 600,
  minHeight: '36px',
  transition: 'background-color 0.2s ease'
};

const fbAuthBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  backgroundColor: 'var(--primary-container)',
  color: 'var(--on-primary-container)',
  borderColor: 'rgba(0, 60, 144, 0.15)'
};

const offlineBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--on-secondary-container)',
  backgroundColor: 'var(--secondary-container)',
  padding: '4px 8px',
  borderRadius: 'var(--rounded-sm)',
  display: 'inline-flex',
  alignItems: 'center'
};

const dropdownContainerStyle: React.CSSProperties = {
  position: 'relative'
};

const userSwitchBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--outline-variant)',
  backgroundColor: 'var(--surface)',
  color: 'var(--on-surface)',
  cursor: 'pointer',
  minHeight: '40px',
  transition: 'background-color 0.2s ease'
};

const avatarStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: 'var(--rounded-full)',
  objectFit: 'cover'
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: 'var(--rounded-full)',
  backgroundColor: 'var(--surface-container-high)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)'
};

const userInfoTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  textAlign: 'right'
};

const userNameStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 700,
  lineHeight: '1.2'
};

const userRoleStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--outline)',
  lineHeight: '1.2'
};

const switchMenuStyle: React.CSSProperties = {
  position: 'absolute',
  top: '46px',
  left: 0,
  width: '200px',
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--outline)',
  borderRadius: 'var(--rounded-md)',
  boxShadow: 'var(--shadow-card-hover)',
  zIndex: 200,
  overflow: 'hidden'
};

const menuHeaderStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-container-high)',
  padding: '8px 12px',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--on-surface)',
  borderBottom: '1px solid var(--outline-variant)',
  display: 'flex',
  alignItems: 'center'
};

const userListStyle: React.CSSProperties = {
  maxHeight: '260px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column'
};

const userItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  border: 'none',
  background: 'none',
  color: 'var(--on-surface)',
  cursor: 'pointer',
  width: '100%',
  transition: 'background-color 0.2s ease',
  minHeight: '36px'
};

const activeUserItemStyle: React.CSSProperties = {
  ...userItemStyle,
  backgroundColor: 'var(--surface-container)',
  fontWeight: 700
};

const menuAvatarStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: 'var(--rounded-full)',
  objectFit: 'cover'
};

const menuAvatarFallbackStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: 'var(--rounded-full)',
  backgroundColor: 'var(--surface-container-high)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)'
};

const roleSelectorContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const roleLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--on-surface-variant)'
};

const selectStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--rounded-md)',
  border: '1px solid var(--outline-variant)',
  backgroundColor: 'var(--surface)',
  color: 'var(--on-surface)',
  fontSize: '0.8rem',
  fontWeight: 600,
  outline: 'none',
  cursor: 'pointer'
};

const hideMobileStyle: React.CSSProperties = {};

// Custom CSS Inject to handle mobile toggling
const injectMediaQueries = () => {
  if (document.getElementById('header-responsive-style')) return;
  const style = document.createElement('style');
  style.id = 'header-responsive-style';
  style.innerHTML = `
    @media (max-width: 768px) {
      header { padding: 0 12px !important; }
      header > div:first-child { display: flex !important; }
      .hide-mobile-text { display: none !important; }
      .mobile-select-role { font-size: 0.75rem !important; padding: 4px 6px !important; }
    }
  `;
  document.head.appendChild(style);
};

if (typeof window !== 'undefined') {
  injectMediaQueries();
}
