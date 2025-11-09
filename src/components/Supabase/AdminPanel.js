import React, { useState, useEffect, useCallback } from 'react'
import { supabase, useAuth } from './index'
import AdminBulkCV from './AdminBulkCV'
import './AdminPanel.css'

const AdminPanel = () => {
  const { user, signOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [allCVs, setAllCVs] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCVs: 0,
    recentCVs: 0
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

      // Load all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Load all CVs
      const { data: cvs, error: cvsError } = await supabase
        .from('cvs')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false })

      if (cvsError) throw cvsError

      // Calculate stats
      const totalUsers = users?.length || 0
      const totalCVs = cvs?.length || 0
      const recentCVs = cvs?.filter(cv => {
        const createdDate = new Date(cv.created_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return createdDate > weekAgo
      }).length || 0

      setAllUsers(users || [])
      setAllCVs(cvs || [])
      setStats({ totalUsers, totalCVs, recentCVs })
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
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      loadAdminData() // Refresh data
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Error deleting user')
    }
  }

  // Delete CV
  const deleteCV = async (cvId) => {
    if (!window.confirm('Are you sure you want to delete this CV?')) return

    try {
      const { error } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cvId)

      if (error) throw error
      loadAdminData() // Refresh data
    } catch (err) {
      console.error('Error deleting CV:', err)
      alert('Error deleting CV')
    }
  }

  // Toggle user admin status
  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      loadAdminData() // Refresh data
    } catch (err) {
      console.error('Error updating admin status:', err)
      alert('Error updating admin status')
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

  if (currentView === 'create-cv') {
    return <AdminBulkCV />
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-actions">
          <button 
            onClick={() => setCurrentView('create-cv')} 
            className="create-cv-button"
          >
            Create CV for Customer
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
        <div className="stat-card">
          <h3>Total CVs</h3>
          <p className="stat-number">{stats.totalCVs}</p>
        </div>
        <div className="stat-card">
          <h3>Recent CVs (7 days)</h3>
          <p className="stat-number">{stats.recentCVs}</p>
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
                <th>Admin</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.full_name || 'N/A'}</td>
                  <td>
                    <span className={`admin-badge ${user.is_admin ? 'admin' : 'user'}`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                      className="toggle-admin-button"
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CVs Management */}
      <div className="admin-section">
        <h2>CVs Management</h2>
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>User</th>
                <th>Template</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allCVs.map((cv) => (
                <tr key={cv.id}>
                  <td>{cv.name}</td>
                  <td>{cv.title || 'N/A'}</td>
                  <td>{cv.users?.email || 'N/A'}</td>
                  <td>{cv.template_id}</td>
                  <td>{new Date(cv.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => deleteCV(cv.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

