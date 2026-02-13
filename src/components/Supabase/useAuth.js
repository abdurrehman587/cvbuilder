import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from './SupabaseProvider'
import { supabase } from './supabase'

// Custom hook for authentication
export const useAuth = () => {
  const { user, session, loading, signUp, signIn, signOut } = useSupabase()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(!!user)
  }, [user])

  return {
    user,
    session,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut
  }
}

// Custom hook for CV operations
export const useCVs = () => {
  const { user } = useSupabase()
  const [cvs, setCvs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check admin status
  const checkAdminStatus = useCallback(async () => {
    if (!user) return false
    
    try {
      console.log('🔍 Checking admin status for user:', user.email)
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, email, full_name')
        .eq('email', user.email)
        .single()
      
      if (error) {
        console.error('❌ Error checking admin status:', error)
        throw error
      }
      
      console.log('👤 User data from database:', data)
      const isAdmin = data?.is_admin || false
      console.log('🔐 Is admin:', isAdmin)
      return isAdmin
    } catch (err) {
      console.error('❌ Error checking admin status:', err)
      return false
    }
  }, [user])

  // Fetch CVs for current user (lightweight version for list display)
  const fetchCVs = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      // Check if user is admin
      const adminStatus = await checkAdminStatus()
      setIsAdmin(adminStatus)
      
      let query = supabase
        .from('cvs')
        .select(`
          id,
          name,
          title,
          company,
          created_at,
          updated_at,
          cv_data->personal_info->phone,
          cv_data->personal_info->email,
          user_id
        `)
        .order('created_at', { ascending: false })
      
      // If admin, get all CVs; otherwise, get only user's CVs
      if (!adminStatus) {
        query = query.eq('user_id', user.id)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('❌ Error fetching CVs:', error)
        throw error
      }
      setCvs(data || [])
    } catch (err) {
      console.error('❌ Error in fetchCVs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, checkAdminStatus])

  // Fetch complete CV data when needed (for editing)
  const fetchCompleteCV = async (cvId) => {
    if (!user) return null

    try {
      // Check if user is admin
      const adminStatus = await checkAdminStatus()
      
      let query = supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
      
      // If not admin, restrict to user's own CVs
      if (!adminStatus) {
        query = query.eq('user_id', user.id)
      }
      
      const { data, error } = await query.single()
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching complete CV:', err)
      throw err
    }
  }

  // Create new CV
  const createCV = async (cvData) => {
    if (!user) throw new Error('User not authenticated')

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('cvs')
        .insert([{
          ...cvData,
          user_id: user.id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      setCvs(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update existing CV
  const updateCV = async (cvId, cvData) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('cvs')
        .update(cvData)
        .eq('id', cvId)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      setCvs(prev => prev.map(cv => cv.id === cvId ? data : cv))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete CV
  const deleteCV = async (cvId) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cvId)
        .eq('user_id', user.id)
      
      if (error) throw error
      setCvs(prev => prev.filter(cv => cv.id !== cvId))
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Escape term for safe use in ilike (%, _, \ are special in LIKE)
  const escapeIlike = (term) => {
    if (!term || typeof term !== 'string') return ''
    return term.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
  }

  // Search CVs (lightweight version) - does not set global loading so search UI stays responsive
  // Matches by each word (e.g. "aqsa ahsan" finds CVs with both "aqsa" and "ahsan" in any searchable field)
  const searchCVs = async (searchTerm) => {
    if (!user) return []
    const trimmed = (searchTerm && typeof searchTerm === 'string' ? searchTerm.trim() : '') || ''
    if (!trimmed) return []

    const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return []

    try {
      const adminStatus = await checkAdminStatus()

      // Build OR conditions per word so DB returns any CV containing at least one of the words
      const orParts = words.flatMap((word) => {
        const escaped = escapeIlike(word)
        const pattern = `%${escaped}%`
        return [`name.ilike.${pattern}`, `title.ilike.${pattern}`, `company.ilike.${pattern}`]
      })
      const orClause = orParts.join(',')

      let query = supabase
        .from('cvs')
        .select(`
          id,
          name,
          title,
          company,
          created_at,
          updated_at,
          cv_data->personal_info->phone,
          cv_data->personal_info->email,
          user_id
        `)
        .or(orClause)
        .order('created_at', { ascending: false })

      if (!adminStatus) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error searching CVs:', error)
        throw error
      }

      const list = data || []
      // Keep only CVs where every search word appears (case-insensitive) in name, title, company, phone, or email
      return list.filter((cv) => {
        const name = (cv.name ?? '').toString().toLowerCase()
        const title = (cv.title ?? '').toString().toLowerCase()
        const company = (cv.company ?? '').toString().toLowerCase()
        const phone = (cv.phone ?? cv.cv_data?.personal_info?.phone ?? '').toString().toLowerCase()
        const email = (cv.email ?? cv.cv_data?.personal_info?.email ?? '').toString().toLowerCase()
        const searchable = `${name} ${title} ${company} ${phone} ${email}`
        return words.every((word) => searchable.includes(word))
      })
    } catch (err) {
      console.error('❌ Error in searchCVs:', err)
      setError(err.message)
      return []
    }
  }

  // Auto-fetch CVs when user changes
  useEffect(() => {
    if (user) {
      fetchCVs()
    } else {
      setCvs([])
    }
  }, [user, fetchCVs])

  return {
    cvs,
    loading,
    error,
    isAdmin,
    fetchCVs,
    fetchCompleteCV,
    createCV,
    updateCV,
    deleteCV,
    searchCVs
  }
}

export default useAuth
