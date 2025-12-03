import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ctygupgtlawlgcikmkqz.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Debug: Log Supabase configuration
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');

// Database table names
export const TABLES = {
  CVS: 'cvs',
  USERS: 'users',
  TEMPLATES: 'templates'
}

// CV operations
export const cvService = {
  // Get all CVs for a user
  async getCVs(userId) {
    const { data, error } = await supabase
      .from(TABLES.CVS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get a specific CV by ID (user-specific, or admin can access any CV)
  async getCV(cvId, userId, isAdmin = false) {
    let query = supabase
      .from(TABLES.CVS)
      .select('*')
      .eq('id', cvId)
    
    // Only filter by user_id if not admin
    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query.single()
    
    if (error) throw error
    return data
  },

  // Create a new CV
  async createCV(cvData) {
    const { data, error } = await supabase
      .from(TABLES.CVS)
      .insert([cvData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update an existing CV (user-specific, or admin can update any CV)
  async updateCV(cvId, cvData, userId, isAdmin = false) {
    let query = supabase
      .from(TABLES.CVS)
      .update(cvData)
      .eq('id', cvId)
    
    // Only filter by user_id if not admin
    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query.select().single()
    
    if (error) throw error
    return data
  },

  // Delete a CV (user-specific)
  async deleteCV(cvId, userId) {
    const { error } = await supabase
      .from(TABLES.CVS)
      .delete()
      .eq('id', cvId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Search CVs by name, title, or company
  async searchCVs(userId, searchTerm) {
    const { data, error } = await supabase
      .from(TABLES.CVS)
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Find CV by name for a user (to prevent duplicates)
  async findCVByName(userId, name, isAdmin = false) {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    
    let query = supabase
      .from(TABLES.CVS)
      .select('*')
      .ilike('name', trimmedName) // Case-insensitive comparison
    
    // Only filter by user_id if not admin
    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }
    
    // Get the most recent CV with this name
    query = query.order('created_at', { ascending: false }).limit(1)
    
    const { data, error } = await query
    
    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  }
}

// Authentication operations
export const authService = {
  // Sign up a new user
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in an existing user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out current user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Sign in with Google OAuth
  async signInWithGoogle() {
    // Use environment variable for redirect URL, or fallback to current origin
    // In production, set REACT_APP_SITE_URL=https://getglory.pk
    const redirectUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectUrl}/`
      }
    })
    
    if (error) throw error
    return data
  },

  // Reset password (forgot password)
  async resetPassword(email) {
    const redirectUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}/#reset-password`
    })
    
    if (error) throw error
    return data
  },

  // Update password (after clicking reset link)
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
    return data
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Storage operations for CV files
export const storageService = {
  // Upload CV PDF
  async uploadCVPDF(userId, cvId, file) {
    const fileName = `cv-${cvId}-${Date.now()}.pdf`
    const filePath = `${userId}/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('cv-files')
      .upload(filePath, file)
    
    if (error) throw error
    return data
  },

  // Get CV PDF download URL
  async getCVPDFUrl(userId, fileName) {
    const { data, error } = await supabase.storage
      .from('cv-files')
      .createSignedUrl(`${userId}/${fileName}`, 3600) // 1 hour expiry
    
    if (error) throw error
    return data.signedUrl
  },

  // Delete CV PDF
  async deleteCVPDF(userId, fileName) {
    const { error } = await supabase.storage
      .from('cv-files')
      .remove([`${userId}/${fileName}`])
    
    if (error) throw error
  }
}

// Template operations
export const templateService = {
  // Get all available templates
  async getTemplates() {
    const { data, error } = await supabase
      .from(TABLES.TEMPLATES)
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Get a specific template
  async getTemplate(templateId) {
    const { data, error } = await supabase
      .from(TABLES.TEMPLATES)
      .select('*')
      .eq('id', templateId)
      .single()
    
    if (error) throw error
    return data
  }
}

export default supabase
