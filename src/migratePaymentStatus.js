import supabase from './supabase';

/**
 * Migration script to fix payment statuses
 * This script will:
 * 1. Find all payments with 'downloaded' status
 * 2. Change them to 'approved' status
 * 3. Ensure download records exist in cv_downloads table
 */
export const migratePaymentStatuses = async () => {
  try {
    console.log('=== PAYMENT STATUS MIGRATION ===');
    
    // Get all payments with 'downloaded' status
    const { data: downloadedPayments, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'downloaded');
    
    if (fetchError) {
      console.error('Error fetching downloaded payments:', fetchError);
      return { success: false, error: fetchError };
    }
    
    console.log(`Found ${downloadedPayments?.length || 0} payments with 'downloaded' status`);
    
    if (!downloadedPayments || downloadedPayments.length === 0) {
      console.log('No payments to migrate');
      return { success: true, migrated: 0 };
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const payment of downloadedPayments) {
      try {
        console.log(`Migrating payment ${payment.id} for user ${payment.user_email}, template ${payment.template_id}`);
        
        // Update payment status to 'approved'
        const { error: updateError } = await supabase
          .from('payments')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);
        
        if (updateError) {
          console.error(`Error updating payment ${payment.id}:`, updateError);
          errorCount++;
          continue;
        }
        
        // Check if download record exists in cv_downloads table
        const { data: existingDownload, error: checkError } = await supabase
          .from('cv_downloads')
          .select('*')
          .eq('payment_id', payment.id)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Error checking download record for payment ${payment.id}:`, checkError);
        }
        
        // If no download record exists, create one
        if (!existingDownload) {
          const { error: insertError } = await supabase
            .from('cv_downloads')
            .insert({
              user_email: payment.user_email,
              template_id: payment.template_id,
              payment_id: payment.id,
              downloaded_at: payment.downloaded_at || payment.updated_at || payment.created_at
            });
          
          if (insertError) {
            console.error(`Error creating download record for payment ${payment.id}:`, insertError);
            errorCount++;
            continue;
          }
          
          console.log(`Created download record for payment ${payment.id}`);
        }
        
        migratedCount++;
        console.log(`Successfully migrated payment ${payment.id}`);
        
      } catch (error) {
        console.error(`Error migrating payment ${payment.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration completed: ${migratedCount} payments migrated, ${errorCount} errors`);
    
    return {
      success: true,
      migrated: migratedCount,
      errors: errorCount,
      total: downloadedPayments.length
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
};

/**
 * Check migration status
 */
export const checkMigrationStatus = async () => {
  try {
    console.log('=== CHECKING MIGRATION STATUS ===');
    
    // Count payments with different statuses
    const { data: statusCounts, error } = await supabase
      .from('payments')
      .select('status');
    
    if (error) {
      console.error('Error checking migration status:', error);
      return null;
    }
    
    const counts = {};
    statusCounts.forEach(payment => {
      counts[payment.status] = (counts[payment.status] || 0) + 1;
    });
    
    console.log('Payment status counts:', counts);
    
    // Check cv_downloads table
    const { data: downloads, error: downloadsError } = await supabase
      .from('cv_downloads')
      .select('*');
    
    if (downloadsError) {
      console.error('Error checking downloads:', downloadsError);
    } else {
      console.log(`Total download records: ${downloads?.length || 0}`);
    }
    
    return {
      paymentCounts: counts,
      downloadCount: downloads?.length || 0,
      needsMigration: counts.downloaded > 0
    };
    
  } catch (error) {
    console.error('Error checking migration status:', error);
    return null;
  }
}; 