import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import type { Forum, ForumPost } from '../types';
import { Users, BookOpen, Megaphone, ChevronLeft, MessageSquare, Search } from 'lucide-react';

interface ForumsProps {
  setPage: (page: string) => void;
  setSelectedForumId: (id: string) => void;
}

export const Forums: React.FC<ForumsProps> = ({ setPage, setSelectedForumId }) => {
  const { currentUser, userTags } = useAuth();
  
  const [forums, setForums] = useState<Forum[]>([]);
  const [forumUnreadStates, setForumUnreadStates] = useState<Record<string, boolean>>({});
  const [forumPostCounts, setForumPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'team' | 'subject' | 'general' | 'unread'>('all');

  useEffect(() => {
    const fetchForums = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const allForums = await dbService.getForums();
        
        // Filter forums: User sees forums belonging to their tags OR general forums (tagId is null)
        const myTagIds = userTags.map(t => t.id);
        const filtered = allForums.filter(f => !f.tagId || myTagIds.includes(f.tagId));
        setForums(filtered);

        // Load posts counts and unread states
        const counts: Record<string, number> = {};
        const unreads: Record<string, boolean> = {};

        for (const forum of filtered) {
          const posts = await dbService.getForumPosts(forum.id);
          counts[forum.id] = posts.length;

          // Check unread status based on last viewed timestamp in localStorage
          const lastViewedTimeStr = localStorage.getItem(`forum_viewed_${currentUser.id}_${forum.id}`);
          
          if (!lastViewedTimeStr) {
            unreads[forum.id] = posts.length > 0;
          } else {
            const lastViewedTime = new Date(lastViewedTimeStr);
            // If there's any post newer than the last viewed timestamp, mark unread
            unreads[forum.id] = posts.some(p => new Date(p.createdAt) > lastViewedTime);
          }
        }

        setForumPostCounts(counts);
        setForumUnreadStates(unreads);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchForums();
  }, [currentUser, userTags]);

  if (loading) {
    return <div style={loadingStyle}>טוען פורומים...</div>;
  }

  const handleForumClick = (forumId: string) => {
    // Save last viewed time for unread calculation
    localStorage.setItem(`forum_viewed_${currentUser?.id}_${forumId}`, new Date().toISOString());
    setSelectedForumId(forumId);
    setPage('forum-feed');
  };

  const getForumIcon = (type: string) => {
    switch (type) {
      case 'team': return <Users size={20} />;
      case 'subject': return <BookOpen size={20} />;
      default: return <Megaphone size={20} />;
    }
  };

  // Apply search + filter
  const filteredForums = forums.filter(forum => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      forum.name.includes(searchQuery.trim()) ||
      forum.description.includes(searchQuery.trim());

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'unread' && forumUnreadStates[forum.id]) ||
      forum.type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const unreadCount = forums.filter(f => forumUnreadStates[f.id]).length;

  const filterButtons: { id: typeof activeFilter; label: string }[] = [
    { id: 'all', label: 'הכל' },
    { id: 'unread', label: `לא נקרא${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { id: 'team', label: 'צוותי' },
    { id: 'subject', label: 'מקצועי' },
    { id: 'general', label: 'כללי' },
  ];

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '20px' }}>פורומים</h1>

      {/* Search + Filter Bar */}
      <div style={searchBarWrapperStyle}>
        <div style={searchInputWrapperStyle}>
          <Search size={16} style={{ color: 'var(--outline)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="חפש פורום לפי שם או תיאור..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        <div style={filterRowStyle}>
          {filterButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setActiveFilter(btn.id)}
              style={activeFilter === btn.id ? activeFilterBtnStyle : filterBtnStyle}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      
      <div style={forumsGridStyle}>
        {filteredForums.length === 0 ? (
          <div style={emptyCardStyle}>
            <MessageSquare size={36} color="var(--outline)" />
            <h3>לא נמצאו פורומים</h3>
            <p className="text-muted">
              {searchQuery || activeFilter !== 'all'
                ? 'נסה לשנות את החיפוש או הסינון.'
                : 'אינך משויך לאף קבוצה עם פורום פעיל כרגע.'}
            </p>
          </div>
        ) : (
          filteredForums.map(forum => {
            const hasUnread = forumUnreadStates[forum.id];
            const postCount = forumPostCounts[forum.id] || 0;
            
            return (
              <div 
                key={forum.id} 
                className="card" 
                onClick={() => handleForumClick(forum.id)}
                style={forumCardStyle}
              >
                {/* Unread Orange Dot */}
                {hasUnread && <div style={unreadDotStyle} title="יש עדכונים חדשים" />}

                <div style={forumHeaderRowStyle}>
                  <div style={iconContainerStyle(forum.type)}>
                    {getForumIcon(forum.type)}
                  </div>
                  <span style={forumTypeBadgeStyle(forum.type)}>
                    {forum.type === 'team' ? 'צוותי' : forum.type === 'subject' ? 'מקצועי' : 'כללי'}
                  </span>
                </div>

                <h3 style={forumTitleStyle}>{forum.name}</h3>
                <p style={forumDescStyle}>{forum.description}</p>

                <div style={forumFooterStyle}>
                  <span style={postCountStyle}>{postCount} פרסומים בפורום</span>
                  <div style={enterBtnStyle}>
                    כניסה לפורום
                    <ChevronLeft size={16} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


// Inline styling
const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  color: 'var(--outline)'
};

const searchBarWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '24px',
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-xl)',
  padding: '16px 20px',
  boxShadow: 'var(--shadow-card)'
};

const searchInputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: 'var(--surface-container-low)',
  border: '1px solid var(--outline-variant)',
  borderRadius: 'var(--rounded-md)',
  padding: '10px 14px'
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '0.92rem',
  color: 'var(--on-surface)',
  fontFamily: 'inherit'
};

const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
};

const filterBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--rounded-full)',
  border: '1px solid var(--outline-variant)',
  backgroundColor: 'var(--surface-container-low)',
  color: 'var(--on-surface-variant)',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const activeFilterBtnStyle: React.CSSProperties = {
  ...filterBtnStyle,
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)',
  borderColor: 'var(--primary)'
};

const forumsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
  gap: '20px'
};

const forumCardStyle: React.CSSProperties = {
  cursor: 'pointer',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  height: '240px',
  justifyContent: 'space-between',
  position: 'relative'
};

const unreadDotStyle: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: 'var(--status-pending)',
  boxShadow: '0 0 6px var(--status-pending)'
};

const forumHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const iconContainerStyle = (type: string): React.CSSProperties => {
  let bgColor = 'rgba(0, 60, 144, 0.1)';
  let color = 'var(--primary)';
  
  if (type === 'subject') {
    bgColor = 'rgba(80, 95, 118, 0.1)';
    color = 'var(--secondary)';
  } else if (type === 'general') {
    bgColor = 'rgba(115, 41, 0, 0.1)';
    color = '#732900';
  }

  return {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--rounded-md)',
    backgroundColor: bgColor,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
};

const forumTypeBadgeStyle = (type: string): React.CSSProperties => {
  let colorClass = 'badge-team';
  if (type === 'subject') colorClass = 'badge-major';
  if (type === 'general') colorClass = 'badge-special';
  
  return {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 'var(--rounded-sm)',
    display: 'inline-block'
  };
};

const forumTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 800,
  color: 'var(--on-surface)',
  margin: '0 0 8px 0'
};

const forumDescStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--on-surface-variant)',
  margin: '0 0 16px 0',
  flex: 1,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const forumFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTop: '1px solid var(--surface-container-high)',
  paddingTop: '12px',
  fontSize: '0.8rem',
  color: 'var(--outline)'
};

const postCountStyle: React.CSSProperties = {
  fontWeight: 600
};

const enterBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: 'var(--primary)',
  fontWeight: 700,
  fontSize: '0.85rem'
};

const emptyCardStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  backgroundColor: 'var(--surface)',
  borderRadius: 'var(--rounded-xl)',
  border: '1px dotted var(--outline)',
  padding: '60px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  color: 'var(--on-surface-variant)',
  textAlign: 'center'
};
