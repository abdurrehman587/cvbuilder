// Supabase components and utilities export file

export { default as SupabaseProvider, useSupabase } from './SupabaseProvider'
export { default as useAuth, useCVs } from './useAuth'
export { default as useAutoSave } from './useAutoSave'
export { default as supabase, cvService, authService, storageService, templateService, cvCreditsService, idCardCreditsService, TABLES } from './supabase'
export { default as database, dbHelpers } from './database'
export { default as AdminPanel } from './AdminPanel'

// Re-export everything for easy importing
export * from './supabase'
export * from './SupabaseProvider'
export * from './useAuth'
export * from './database'
