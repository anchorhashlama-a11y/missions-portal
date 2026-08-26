import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, 
  Moon, 
  User as UserIcon
} from 'lucide-react';

interface HeaderProps {
  setPage?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ setPage }) => {
  const { 
    currentUser, 
    activeRole, 
    userRoles, 
    switchRole,
    loginWithGoogle
  } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (document.documentElement.classList.contains('dark')) return 'dark';
    return 'light';
  });

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

  return (
    <header style={headerStyle}>
      {/* Mobile Brand Name */}
      <div style={brandContainerStyle}>
        <img src="/logo.png" alt="עוגן" style={mobileLogoStyle} />
        <div style={brandWrapperStyle}>
          <h1 style={brandTextStyle}>עוגן</h1>
          <span style={brandSubtitleStyle}>מערכת ניהול ההשלמה הטכנולוגית של תקשוב</span>
        </div>
      </div>

      <div style={controlsStyle}>
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

        {/* Current User Info - Now clickable for Profile */}
        {currentUser ? (
          <div style={dropdownContainerStyle}>
            <div 
              style={{...userSwitchBtnStyle, cursor: setPage ? 'pointer' : 'default'}}
              onClick={() => setPage && setPage('profile')}
              title="לחץ לפרופיל אישי"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="" style={avatarStyle} />
              ) : (
                <div style={avatarFallbackStyle}>
                  <UserIcon size={14} />
                </div>
              )}
              <div style={userInfoTextStyle} className="hide-mobile-text">
                <span style={userNameStyle}>{currentUser.name}</span>
                <span style={userRoleStyle}>
                  {activeRole ? activeRole.name : "ללא תפקיד"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={loginWithGoogle} 
            style={fbAuthBtnStyle}
          >
            <UserIcon size={16} />
            <span style={hideMobileStyle}>התחבר עם גוגל</span>
          </button>
        )}

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

const mobileLogoStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  objectFit: 'contain',
  borderRadius: 'var(--rounded-md)'
};

const brandWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1px'
};

const brandTextStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 800,
  color: 'var(--primary)',
  margin: 0,
  lineHeight: 1.1
};

const brandSubtitleStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 500,
  color: 'var(--on-surface-variant)',
  margin: 0,
  lineHeight: 1.2,
  opacity: 0.85
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
