import React, { useState, useEffect, useCallback } from 'react'
import { supabase, useAuth, cvCreditsService } from './index'
import './AdminPanel.css'

const AdminPanel = ({ initialView = 'marketplace' }) => {
  const { user, signOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState(initialView)
  const [stats, setStats] = useState({
    totalUsers: 0
  })

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('email', user.email)
          .single()

        if (error) throw error
        setIsAdmin(data?.is_admin || false)
      } catch (err) {
        console.error('Error checking admin status:', err)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user])

  // Load admin data
  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return

    try {
      setLoading(true)

      // Load users from public.users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')

      if (usersError) throw usersError

      // Try to get user_type from auth.users metadata using RPC function
      // If RPC function exists, it will return users with user_type
      let usersWithType = []
      
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_users_with_type')
        
        if (rpcError) {
          console.error('RPC function error:', rpcError)
          // If RPC fails, use fallback
          usersWithType = (users || []).map((user) => ({
            ...user,
            user_type: null
          }))
        } else if (rpcData && rpcData.length > 0) {
          console.log('RPC function returned data:', rpcData)
          usersWithType = rpcData
        } else {
          console.warn('RPC function returned empty data')
          // RPC function returned no data, use fallback
          usersWithType = (users || []).map((user) => ({
            ...user,
            user_type: null
          }))
        }
      } catch (rpcErr) {
        console.error('RPC function exception:', rpcErr)
        // RPC function doesn't exist, use users from public.users
        // user_type will be null, but we can still sort by is_admin
        usersWithType = (users || []).map((user) => ({
          ...user,
          user_type: null
        }))
      }
      
      console.log('Users with type:', usersWithType)

      // Sort users: Admin first, then shopkeepers, then regular users
      const sortedUsers = usersWithType.sort((a, b) => {
        // First priority: Admin users (is_admin = true)
        if (a.is_admin && !b.is_admin) return -1
        if (!a.is_admin && b.is_admin) return 1
        
        // If both are admin, ensure admin@cvbuilder.com is first
        if (a.is_admin && b.is_admin) {
          if (a.email === 'admin@cvbuilder.com') return -1
          if (b.email === 'admin@cvbuilder.com') return 1
          return a.email.localeCompare(b.email)
        }
        
        // For non-admin users: shopkeepers before regular users
        if (!a.is_admin && !b.is_admin) {
          const aType = a.user_type || 'regular'
          const bType = b.user_type || 'regular'
          
          if (aType === 'shopkeeper' && bType === 'regular') return -1
          if (aType === 'regular' && bType === 'shopkeeper') return 1
          
          // If same type, sort by email
          return a.email.localeCompare(b.email)
        }
        
        return 0
      })

      // Calculate stats
      const totalUsers = sortedUsers.length

      setAllUsers(sortedUsers)
      setStats({ totalUsers })
    } catch (err) {
      console.error('Error loading admin data:', err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
    }
  }, [isAdmin, loadAdminData])

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete their auth account.')) return

    try {
      // Delete from public.users first (to avoid foreign key constraint)
      const { error: publicDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (publicDeleteError) {
        console.error('Error deleting from public.users:', publicDeleteError)
        throw publicDeleteError
      }

      // Then try to delete from auth.users using RPC function
      try {
        const { error: authDeleteError } = await supabase
          .rpc('delete_auth_user', { user_id: userId })
        
        if (authDeleteError) {
          console.warn('Could not delete from auth.users:', authDeleteError)
          // User is already deleted from public.users, so continue
        }
      } catch (rpcErr) {
        console.warn('RPC function for deleting auth user not available:', rpcErr)
        // User is already deleted from public.users, so continue
      }

      // Refresh data
      loadAdminData()
      alert('User deleted successfully')
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Error deleting user: ' + (err.message || 'Unknown error'))
    }
  }
  
  // Update user type
  const updateUserType = async (userEmail, newUserType) => {
    try {
      const { error } = await supabase
        .rpc('update_user_type', { 
          user_email: userEmail,
          new_user_type: newUserType 
        })

      if (error) throw error
      
      // Refresh data
      loadAdminData()
      alert(`User type updated to ${newUserType === 'shopkeeper' ? 'Shopkeeper' : 'Regular User'}`)
    } catch (err) {
      console.error('Error updating user type:', err)
      alert('Error updating user type: ' + (err.message || 'Unknown error'))
    }
  }

  // Add CV credits to a shopkeeper
  const addCreditsToShopkeeper = async (userId, creditsToAdd) => {
    const credits = parseInt(creditsToAdd)
    if (isNaN(credits) || credits <= 0) {
      alert('Please enter a valid number of credits (greater than 0)')
      return
    }

    try {
      const newCredits = await cvCreditsService.addCredits(userId, credits)
      loadAdminData() // Refresh data
      alert(`Successfully added ${credits} CV credits. New total: ${newCredits} credits`)
    } catch (err) {
      console.error('Error adding CV credits:', err)
      alert('Error adding CV credits: ' + (err.message || 'Unknown error'))
    }
  }

  if (!user) {
    return (
      <div className="admin-panel">
        <div className="admin-login-required">
          <h2>Admin Panel</h2>
          <p>Please log in to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-access-denied">
          <h2>Access Denied</h2>
          <p>You don't have admin privileges.</p>
          <button onClick={signOut} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    )
  }

  const handleBackToAdmin = () => {
    window.location.hash = '#admin';
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <button 
          onClick={handleBackToAdmin}
          style={{
            marginBottom: '15px',
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#666',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e0e0e0';
            e.target.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f0f0f0';
            e.target.style.color = '#666';
          }}
        >
          ← Back to Admin Dashboard
        </button>
        <h1>Admin Panel</h1>
        <div className="admin-actions">
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="admin-nav-button"
          >
            Dashboard
          </button>
          <button onClick={loadAdminData} className="refresh-button" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={signOut} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Users Management */}
      <div className="admin-section">
        <h2>Users Management</h2>
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Full Name</th>
                <th>User Type</th>
                <th>CV Credits</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => {
                // Determine user type display
                let userTypeDisplay = 'Regular User'
                let badgeClass = 'user'
                
                // Debug logging
                if (user.email === 'glorycomposing@gmail.com') {
                  console.log('Debug user data:', {
                    email: user.email,
                    is_admin: user.is_admin,
                    user_type: user.user_type,
                    fullUser: user
                  })
                }
                
                if (user.is_admin) {
                  userTypeDisplay = 'Admin'
                  badgeClass = 'admin'
                } else if (user.user_type === 'shopkeeper' || user.user_type === 'Shopkeeper') {
                  userTypeDisplay = 'Shopkeeper'
                  badgeClass = 'shopkeeper'
                } else {
                  userTypeDisplay = 'Regular User'
                  badgeClass = 'user'
                }
                
                return (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.full_name || 'N/A'}</td>
                    <td>
                      <span className={`admin-badge ${badgeClass}`}>
                        {userTypeDisplay}
                      </span>
                    </td>
                    <td>
                      {user.user_type === 'shopkeeper' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '600', color: (user.cv_credits || 0) > 0 ? '#28a745' : '#dc3545' }}>
                            {user.cv_credits || 0}
                          </span>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            data-user-id={user.id}
                            style={{
                              width: '50px',
                              padding: '4px 6px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const credits = e.target.value
                                if (credits) {
                                  addCreditsToShopkeeper(user.id, credits)
                                  e.target.value = ''
                                }
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = e.target.parentElement.querySelector('input[data-user-id]')
                              const credits = input?.value || prompt('Enter number of CV credits to add:')
                              if (credits) {
                                addCreditsToShopkeeper(user.id, credits)
                                if (input) input.value = ''
                              }
                            }}
                            className="toggle-admin-button"
                            style={{ 
                              padding: '4px 8px',
                              fontSize: '11px'
                            }}
                            title="Add CV Credits"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>N/A</span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      {!user.is_admin && user.user_type !== 'shopkeeper' && (
                        <button
                          onClick={() => updateUserType(user.email, 'shopkeeper')}
                          className="toggle-admin-button"
                          style={{ marginRight: '0.5rem' }}
                          title="Update to Shopkeeper"
                        >
                          Set Shopkeeper
                        </button>
                      )}
                      {!user.is_admin && user.user_type === 'shopkeeper' && (
                        <button
                          onClick={() => updateUserType(user.email, 'regular')}
                          className="toggle-admin-button"
                          style={{ marginRight: '0.5rem', backgroundColor: '#6c757d' }}
                          title="Update to Regular User"
                        >
                          Set Regular
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

