import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './SearchCV.css';
import { useCVs } from '../Supabase';
import { cvService, supabase } from '../Supabase/supabase';

const SearchCV = ({ onBack, onEditCV }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [useClientSearch, setUseClientSearch] = useState(true);
  const [loadingCV, setLoadingCV] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [displayLimit, setDisplayLimit] = useState(50);
  const { cvs, searchCVs, fetchCompleteCV, loading, isAdmin } = useCVs();
  
  const searchTimeoutRef = useRef(null);
  const searchCacheRef = useRef(new Map());

  // Fetch user information for admin display
  const fetchUserInfo = useCallback(async (userId) => {
    if (!isAdmin || userInfo[userId]) return userInfo[userId];
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setUserInfo(prev => ({
        ...prev,
        [userId]: data
      }));
      
      return data;
    } catch (err) {
      console.error('Error fetching user info:', err);
      return null;
    }
  }, [isAdmin, userInfo]);

  // Client-side search function (much faster for small datasets)
  const performClientSearch = useCallback((term, allCVs) => {
    if (!term.trim()) {
      return allCVs;
    }

    const lowerTerm = term.toLowerCase();
    return allCVs.filter(cv => {
      const name = cv.name?.toLowerCase() || '';
      const title = cv.title?.toLowerCase() || '';
      const company = cv.company?.toLowerCase() || '';
      const phone = cv.phone?.toLowerCase() || '';
      const email = cv.email?.toLowerCase() || '';
      
      return name.includes(lowerTerm) || 
             title.includes(lowerTerm) || 
             company.includes(lowerTerm) ||
             phone.includes(lowerTerm) ||
             email.includes(lowerTerm);
    });
  }, []);

  // Server-side search function (for large datasets or complex queries)
  const performServerSearch = useCallback(async (term) => {
    // Check cache first
    if (searchCacheRef.current.has(term)) {
      return searchCacheRef.current.get(term);
    }

    try {
      setIsSearching(true);
      const results = await searchCVs(term);
      
      // Cache the results
      searchCacheRef.current.set(term, results);
      
      // Limit cache size to prevent memory issues
      if (searchCacheRef.current.size > 50) {
        const firstKey = searchCacheRef.current.keys().next().value;
        searchCacheRef.current.delete(firstKey);
      }
      
      return results;
    } catch (err) {
      console.error('Search error:', err);
      setErrorMessage('Search failed. Please try again.');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [searchCVs]);

  // Optimized search function that chooses between client and server search
  const performSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults(cvs);
      return;
    }

    // Use client-side search for small datasets (< 100 CVs) or short search terms
    if (useClientSearch && cvs.length < 100) {
      const results = performClientSearch(term, cvs);
      setSearchResults(results);
      return;
    }

    // Use server-side search for larger datasets or complex queries
    const results = await performServerSearch(term);
    setSearchResults(results);
  }, [cvs, useClientSearch, performClientSearch, performServerSearch]);

  // Handle search input change with optimized debouncing
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Use shorter debounce for client search, longer for server search
    const debounceDelay = useClientSearch ? 150 : 300;
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, debounceDelay);
  }, [performSearch, useClientSearch]);

  // Memoized search results to prevent unnecessary re-renders
  const memoizedSearchResults = useMemo(() => {
    return searchResults.map((cv) => {
      // Phone and email are now directly accessible from the query
      const phoneNumber = cv.phone || 'No phone number';
      const email = cv.email || 'No email';
      return {
        ...cv,
        phoneNumber,
        email
      };
    });
  }, [searchResults]);

  // Reset display limit when search term changes
  useEffect(() => {
    setDisplayLimit(50);
  }, [searchTerm]);

  // Get displayed results (limited to displayLimit)
  const displayedResults = useMemo(() => {
    return memoizedSearchResults.slice(0, displayLimit);
  }, [memoizedSearchResults, displayLimit]);

  // Check if there are more results to load
  const hasMoreResults = memoizedSearchResults.length > displayLimit;

  // Load more results
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 50);
  };

  const handleCVClick = async (cv) => {
    if (onEditCV) {
      try {
        setLoadingCV(cv.id);
        // Load complete CV data when user clicks to edit
        const completeCV = await fetchCompleteCV(cv.id);
        if (completeCV) {
          onEditCV(completeCV);
          setErrorMessage(null);
        } else {
          console.error('Failed to load complete CV data');
          // Fallback to lightweight data
          onEditCV(cv);
          setErrorMessage('Failed to load complete CV data. Showing basic data.');
        }
      } catch (error) {
        console.error('Error loading complete CV:', error);
        // Fallback to lightweight data
        onEditCV(cv);
        setErrorMessage('Error loading complete CV. Showing basic data.');
      } finally {
        setLoadingCV(null);
      }
    }
  };

  const handleDeleteCV = async (cvId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this CV? This action cannot be undone.')) {
      try {
        // Get current user for deletion
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error getting current user:', userError);
          alert('Authentication error. Please log in again.');
          return;
        }
        
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin')
          .eq('email', user.email)
          .single();
        
        const isAdmin = userData?.is_admin || false;
        
        if (isAdmin) {
          // Admin can delete any CV - don't filter by user_id
          const { error } = await supabase
            .from('cvs')
            .delete()
            .eq('id', cvId);
          
          if (error) throw error;
        } else {
          // Regular user can only delete their own CVs
          await cvService.deleteCV(cvId, user.id);
        }
        
        // Remove from search results
        setSearchResults(prev => prev.filter(cv => cv.id !== cvId));
      } catch (error) {
        console.error('Error deleting CV:', error);
        alert('Failed to delete CV. Please try again.');
        setErrorMessage('Failed to delete CV.');
      }
    }
  };

  // Load all CVs on component mount
  useEffect(() => {
    if (cvs.length > 0) {
      setSearchResults(cvs);
    }
  }, [cvs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="search-cv-container">
      <div className="search-cv-header">
        <button onClick={onBack} className="back-button">
          ← Back to Dashboard
        </button>
        <h2>Search for Existing CV</h2>
        <p className="search-description">Find and edit your previously created CVs</p>
        {isAdmin && (
          <div className="admin-indicator-simple">
            <span className="admin-text">Admin</span>
          </div>
        )}
      </div>

      <div className="search-section">
        <div className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by name, title, or keywords..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {isSearching && (
              <div className="search-loading">
                <div className="search-spinner"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {memoizedSearchResults.length > 0 && (
        <div className="search-results">
          <div className="search-results-header">
            <h3>Search Results ({memoizedSearchResults.length})</h3>
          </div>
          <div className="results-list">
            {displayedResults.map((cv) => {
              // Fetch user info for admin if needed
              if (isAdmin && cv.user_id && !userInfo[cv.user_id]) {
                fetchUserInfo(cv.user_id);
              }
              
              const user = userInfo[cv.user_id];
              const phoneNumber = cv.phone || 'No phone';
              const email = cv.email || 'No email';
              
              return (
                <div key={cv.id} className={`cv-result-card ${loadingCV === cv.id ? 'loading' : ''}`} onClick={() => handleCVClick(cv)}>
                  <div className="cv-info">
                    <h4>{cv.name}</h4>
                    <p className="cv-phone">{phoneNumber}</p>
                    <p className="cv-email">{email}</p>
                    {isAdmin && user && (
                      <div className="cv-user-info">
                        <small className="user-email">👤 {user.email}</small>
                        {user.full_name && <small className="user-name">({user.full_name})</small>}
                      </div>
                    )}
                  </div>
                  <div className="cv-actions">
                    {loadingCV === cv.id ? (
                      <div className="loading-spinner-small"></div>
                    ) : (
                      <button 
                        className="delete-icon" 
                        onClick={(e) => handleDeleteCV(cv.id, e)}
                        title="Delete CV"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {hasMoreResults && (
            <div className="load-more-container">
              <button 
                className="load-more-button"
                onClick={handleLoadMore}
              >
                Load More ({memoizedSearchResults.length - displayLimit} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {searchTerm && searchResults.length === 0 && !isSearching && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No CVs found</h3>
          <p>Try searching with different keywords</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading CVs...</p>
        </div>
      )}

      {/* Error State */}
      {errorMessage && (
        <div className="error-state">
          <p>Error: {errorMessage}</p>
        </div>
      )}

    </div>
  );
};

export default SearchCV;
