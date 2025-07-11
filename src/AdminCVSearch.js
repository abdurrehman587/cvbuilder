import React, { useState, useEffect } from 'react';
import supabase from './supabase';

const AdminCVSearch = ({ onSelectCV, onBack, embedded }) => {
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const performLiveSearch = async () => {
      if ((!searchName || searchName.length < 2) && (!searchPhone || searchPhone.length < 2)) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        let userQuery = supabase.from('user_cvs').select('*').limit(10);
        let adminQuery = supabase.from('admin_cvs').select('*').limit(10);
        if (searchName && searchName.length >= 2) {
          userQuery = userQuery.ilike('name', `%${searchName}%`);
          adminQuery = adminQuery.ilike('name', `%${searchName}%`);
        }
        if (searchPhone && searchPhone.length >= 2) {
          const cleanSearchPhone = searchPhone.replace(/\D/g, '');
          userQuery = userQuery.or(`phone.ilike.%${searchPhone}%,phone.ilike.%${cleanSearchPhone}%`);
          adminQuery = adminQuery.or(`phone.ilike.%${searchPhone}%,phone.ilike.%${cleanSearchPhone}%`);
        }
        const [userResult, adminResult] = await Promise.all([
          userQuery,
          adminQuery
        ]);
        const allResults = [
          ...(userResult.data || []),
          ...(adminResult.data || [])
        ];
        setSearchResults(allResults);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const timeoutId = setTimeout(performLiveSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchName, searchPhone]);

  const handleSelectSearchResult = (cv) => {
    setSearchName('');
    setSearchPhone('');
    setSearchResults([]);
    setShowSearchResults(false);
    if (onSelectCV) onSelectCV(cv);
  };

  if (embedded) {
    return (
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, color: '#222', marginBottom: 18, textAlign: 'center' }}>Search Existing CV</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Search CV by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ padding: '10px', fontSize: 15, borderRadius: 7, border: '1px solid #d1d5db' }}
          />
          <input
            type="text"
            placeholder="Search CV by Phone Number"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            style={{ padding: '10px', fontSize: 15, borderRadius: 7, border: '1px solid #d1d5db' }}
          />
        </div>
        {showSearchResults && (
          <div style={{ marginTop: 12, background: '#f9fafb', borderRadius: 7, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxHeight: 220, overflowY: 'auto' }}>
            {isSearching ? (
              <div style={{ padding: 12, textAlign: 'center', color: '#6b7280' }}>Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((cv, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSearchResult(cv)}
                  style={{
                    padding: 12,
                    borderBottom: index < searchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer',
                    background: '#fff',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 2 }}>{cv.name || 'Unnamed CV'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{cv.phone && `📞 ${cv.phone}`}{cv.phone && cv.email && ' • '}{cv.email && `📧 ${cv.email}`}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: 12, textAlign: 'center', color: '#6b7280' }}>No results found</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Standalone (full page) mode
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minWidth: 340, width: 400, maxWidth: '90vw' }}>
        <button onClick={onBack} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>&larr; Back</button>
        <h2 style={{ fontWeight: 700, fontSize: 28, color: '#222', marginBottom: 24 }}>Search Existing CV</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="Search CV by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ padding: '12px', fontSize: 16, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <input
            type="text"
            placeholder="Search CV by Phone Number"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            style={{ padding: '12px', fontSize: 16, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </div>
        {showSearchResults && (
          <div style={{ marginTop: 16, background: '#f9fafb', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxHeight: 300, overflowY: 'auto' }}>
            {isSearching ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((cv, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSearchResult(cv)}
                  style={{
                    padding: 16,
                    borderBottom: index < searchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer',
                    background: '#fff',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ fontWeight: 600, fontSize: 17, color: '#111827', marginBottom: 4 }}>{cv.name || 'Unnamed CV'}</div>
                  <div style={{ fontSize: 15, color: '#6b7280' }}>{cv.phone && `📞 ${cv.phone}`}{cv.phone && cv.email && ' • '}{cv.email && `📧 ${cv.email}`}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>No results found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCVSearch; 