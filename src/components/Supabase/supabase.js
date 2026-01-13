import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

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
  // For admins, prefer CVs belonging to the current user to avoid updating wrong CVs
  async findCVByName(userId, name, isAdmin = false) {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    
    // Always start by looking for CVs belonging to the current user first
    // This prevents admins from accidentally updating CVs from other users
    let query = supabase
      .from(TABLES.CVS)
      .select('*')
      .eq('name', trimmedName) // Exact match (case-sensitive) to prevent duplicates
      .eq('user_id', userId) // Always filter by user_id first, even for admins
    
    // Get the most recent CV with this exact name for this user
    query = query.order('created_at', { ascending: false }).limit(1)
    
    const { data, error } = await query
    
    if (error) throw error
    
    // If found, return it
    if (data && data.length > 0) {
      return data[0]
    }
    
    // For non-admins, return null if not found
    // For admins, we could search all CVs, but this is dangerous as it might
    // update the wrong CV. So we return null to force creation of new CV
    // if admin is creating CV for a different user
    return null
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
    // Check if running on Capacitor (mobile app)
    const isNative = Capacitor.isNativePlatform();
    console.log('Google Sign-In - isNative:', isNative);
    
    // Use environment variable for redirect URL, or fallback to current origin
    // In production, set REACT_APP_SITE_URL=https://getglory.pk
    const redirectUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
    
    // For mobile apps, use a web URL that will redirect to the app
    // This web URL must be added to Google Cloud Console
    // The web page should redirect to getglory://oauth-callback
    const mobileRedirectUrl = isNative 
      ? `${redirectUrl}/oauth-callback` 
      : `${redirectUrl}/`;
    
    console.log('Google Sign-In - redirectUrl:', mobileRedirectUrl);
    
    // Set flag to indicate Google sign-in started (for OAuth callback detection)
    sessionStorage.setItem('googleSignInStarted', 'true');
    
    // Dispatch event immediately to show loading state
    window.dispatchEvent(new CustomEvent('googleSignInStarted'));
    
    try {
      // On mobile, we MUST use skipBrowserRedirect to prevent WebView
      // Then manually open in system browser
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: mobileRedirectUrl,
          // CRITICAL: On mobile, skip browser redirect to prevent WebView
          skipBrowserRedirect: isNative,
          // Optimize query parameters for faster processing
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        console.error('Google Sign-In OAuth error:', error);
        window.dispatchEvent(new CustomEvent('googleSignInError', { detail: error }));
        throw error;
      }
      
      // On mobile, open the OAuth URL in system browser (not WebView)
      if (isNative && data?.url) {
        console.log('Opening OAuth URL in system browser:', data.url);
        try {
          // Browser.open() opens in the system browser by default
          // Use faster opening without waiting for full load
          Browser.open({ 
            url: data.url
          }).then(() => {
            console.log('Browser opened successfully');
            window.dispatchEvent(new CustomEvent('googleSignInBrowserOpened'));
          }).catch((browserError) => {
            console.error('Failed to open browser:', browserError);
            window.dispatchEvent(new CustomEvent('googleSignInError', { detail: browserError }));
            throw new Error('Failed to open browser for Google Sign-In');
          });
        } catch (browserError) {
          console.error('Failed to open browser:', browserError);
          window.dispatchEvent(new CustomEvent('googleSignInError', { detail: browserError }));
          throw new Error('Failed to open browser for Google Sign-In');
        }
      }
      
      return data;
    } catch (err) {
      window.dispatchEvent(new CustomEvent('googleSignInError', { detail: err }));
      throw err;
    }
  },

  // Reset password (forgot password)
  async resetPassword(email) {
    const redirectUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
    // Supabase will append the tokens to the hash, so we just need the base URL with the route
    // Don't include the hash in redirectTo - Supabase will add it
    const resetUrl = `${redirectUrl}/#reset-password`;
    
    console.log('Sending password reset email with redirect URL:', resetUrl);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl
    })
    
    if (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
    
    console.log('Password reset email sent successfully');
    return data;
  },

  // Update password (after clicking reset link)
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
    return data
  },

  // Update user metadata
  async updateUserMetadata(metadata) {
    // Prevent users from changing their own user_type
    // Only allow setting user_type if it doesn't exist yet, or if admin is changing it
    if (metadata.user_type !== undefined) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Check if user already has a user_type
        const currentUserType = user.user_metadata?.user_type
        if (currentUserType && currentUserType !== metadata.user_type) {
          // User is trying to change their own type - check if they're admin
          const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single()
          
          const isAdmin = userData?.is_admin === true
          
          if (!isAdmin) {
            throw new Error('You cannot change your own user type. Only admins can change user types.')
          }
        }
      } catch (err) {
        // If it's our custom error, throw it
        if (err.message && err.message.includes('cannot change your own user type')) {
          throw err
        }
        // Otherwise, log and continue (might be a new user without a record yet)
        console.warn('Could not verify admin status for user_type update:', err)
      }
    }

    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    })
    
    if (error) throw error
    return data
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// CV Credits Service for Shopkeepers
export const cvCreditsService = {
  // Get current CV credits for a user
  async getCredits(userId) {
    const { data, error } = await supabase
      .rpc('get_cv_credits', { user_id: userId })
    
    if (error) throw error
    return data || 0
  },

  // Decrement CV credits (returns new credit count, or -1 if not shopkeeper, or 0 if no credits)
  async decrementCredits(userId) {
    const { data, error } = await supabase
      .rpc('decrement_cv_credits', { user_id: userId })
    
    if (error) throw error
    return data
  },

  // Add CV credits to a shopkeeper (admin only)
  async addCredits(userId, creditsToAdd) {
    const { data, error } = await supabase
      .rpc('add_cv_credits', { 
        user_id: userId,
        credits_to_add: creditsToAdd 
      })
    
    if (error) throw error
    return data
  },

  // Check if user can download CV (has credits)
  async canDownloadCV(userId) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // Check credits for all users
      const credits = await this.getCredits(userId)
      return credits > 0
    } catch (err) {
      console.error('Error checking download permission:', err)
      return false
    }
  },

  // Add credits for referral (when someone visits via shared link)
  async addCreditsForReferral(referrerUserId, visitorUserId) {
    try {
      // Prevent self-referral
      if (referrerUserId === visitorUserId) {
        return { success: false, message: 'Cannot refer yourself.' };
      }

      // Check if this referral was already processed (prevent duplicate credits)
      const referralKey = `cv_referral_${referrerUserId}_${visitorUserId}`;
      const alreadyProcessed = localStorage.getItem(referralKey) === 'true';
      
      if (alreadyProcessed) {
        return { success: false, message: 'This referral was already processed.' };
      }

      // Add 1 credit for the referrer
      const newCredits = await this.addCredits(referrerUserId, 1);
      
      // Only mark as processed if credit was successfully added
      if (newCredits !== null && newCredits !== undefined) {
        // Mark referral as processed
        localStorage.setItem(referralKey, 'true');
        
        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('cvCreditsUpdated'));
        
        return { success: true, credits: newCredits, message: '✅ Referral credit added!' };
      } else {
        return { success: false, message: 'Failed to add credits. Please try again.' };
      }
    } catch (err) {
      console.error('Error adding credits for referral:', err);
      return { success: false, message: 'Failed to add credits. Please try again.' };
    }
  }
}

// ID Card Credits Service for All Users
export const idCardCreditsService = {
  // Get current ID Card credits for a user
  async getCredits(userId) {
    const { data, error } = await supabase
      .rpc('get_id_card_credits', { user_id: userId })
    
    if (error) throw error
    return data || 0
  },

  // Decrement ID Card credits (returns new credit count, or 0 if no credits)
  async decrementCredits(userId) {
    const { data, error } = await supabase
      .rpc('decrement_id_card_credits', { user_id: userId })
    
    if (error) throw error
    return data
  },

  // Add ID Card credits to a user (admin only)
  async addCredits(userId, creditsToAdd) {
    const { data, error } = await supabase
      .rpc('add_id_card_credits', { 
        user_id: userId,
        credits_to_add: creditsToAdd 
      })
    
    if (error) throw error
    return data
  },

  // Check if user can print ID Cards (has credits)
  async canPrintIDCard(userId) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // Check credits for all users
      const credits = await this.getCredits(userId)
      return credits > 0
    } catch (err) {
      console.error('Error checking print permission:', err)
      return false
    }
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
