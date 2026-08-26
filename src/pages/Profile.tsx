import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Tag as TagIcon, LogOut } from 'lucide-react';

interface ProfileProps {
  setPage: (page: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ setPage }) => {
  const { currentUser, activeRole, userRoles, userTags, logout } = useAuth();

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logout();
    setPage('home');
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>פרופיל אישי</h2>
      </div>

      <div style={cardStyle}>
        <div style={profileHeaderStyle}>
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} style={avatarStyle} />
          ) : (
            <div style={avatarFallbackStyle}>
              <User size={48} />
            </div>
          )}
          <div style={profileNameContainerStyle}>
            <h3 style={nameStyle}>{currentUser.name}</h3>
            <span style={emailStyle}>
              <Mail size={14} />
              {currentUser.email}
            </span>
          </div>
        </div>

        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>
            <Shield size={16} />
            תפקידים במערכת
          </h4>
          <div style={badgesContainerStyle}>
            {userRoles.map(role => (
              <span 
                key={role.id} 
                style={{
                  ...badgeStyle,
                  backgroundColor: role.id === activeRole?.id ? 'var(--primary-container)' : 'var(--surface-container-high)',
                  color: role.id === activeRole?.id ? 'var(--on-primary-container)' : 'var(--on-surface)',
                  border: role.id === activeRole?.id ? '1px solid var(--primary)' : '1px solid var(--outline-variant)'
                }}
              >
                {role.name} {role.id === activeRole?.id && '(פעיל)'}
              </span>
            ))}
            {userRoles.length === 0 && <span style={emptyStyle}>אין תפקידים מוגדרים</span>}
          </div>
        </div>

        <div style={sectionStyle}>
          <h4 style={sectionTitleStyle}>
            <TagIcon size={16} />
            תגיות משויכות
          </h4>
          <div style={badgesContainerStyle}>
            {userTags.map(tag => (
              <span key={tag.id} style={{ ...badgeStyle, backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}>
                {tag.name}
              </span>
            ))}
            {userTags.length === 0 && <span style={emptyStyle}>אין תגיות מוגדרות</span>}
          </div>
        </div>

        <div style={actionsStyle}>
          <button onClick={handleLogout} style={logoutBtnStyle}>
            <LogOut size={18} />
            התנתק מהמערכת
          </button>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  padding: '24px',
  maxWidth: '800px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: 'var(--on-background)',
  margin: 0
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  borderRadius: 'var(--rounded-lg)',
  border: '1px solid var(--outline-variant)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px'
};

const profileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  borderBottom: '1px solid var(--outline-variant)',
  paddingBottom: '24px'
};

const avatarStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: 'var(--rounded-full)',
  objectFit: 'cover',
  border: '3px solid var(--surface-container-high)'
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: 'var(--rounded-full)',
  backgroundColor: 'var(--surface-container-high)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface-variant)',
  border: '3px solid var(--surface-container)'
};

const profileNameContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const nameStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--on-surface)',
  margin: 0
};

const emailStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: 'var(--on-surface-variant)',
  fontSize: '0.9rem'
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'var(--on-surface)',
  margin: 0
};

const badgesContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
};

const badgeStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 'var(--rounded-md)',
  fontSize: '0.85rem',
  fontWeight: 600,
  border: '1px solid var(--outline-variant)',
  display: 'inline-flex',
  alignItems: 'center'
};

const emptyStyle: React.CSSProperties = {
  color: 'var(--on-surface-variant)',
  fontSize: '0.9rem',
  fontStyle: 'italic'
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-start',
  paddingTop: '16px',
  borderTop: '1px solid var(--outline-variant)'
};

const logoutBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  borderRadius: 'var(--rounded-md)',
  border: 'none',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease'
};
