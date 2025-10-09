// Supabase Integration Verification Script
// Run this in your browser console to test your Supabase setup

console.log('🔧 CV Builder Supabase Integration Test');
console.log('=====================================');

// Test 1: Check if Supabase client is loaded
console.log('\n1. Checking Supabase Client...');
if (typeof supabase !== 'undefined') {
    console.log('✅ Supabase client library loaded');
} else {
    console.log('❌ Supabase client library not found');
}

// Test 2: Check configuration
console.log('\n2. Checking Configuration...');
if (window.supabaseConfig) {
    console.log('✅ Supabase config available');
    console.log('URL:', window.supabaseConfig.supabaseUrl);
    console.log('Available:', window.supabaseConfig.isAvailable());
} else {
    console.log('❌ Supabase config not found');
}

// Test 3: Check database manager
console.log('\n3. Checking Database Manager...');
if (window.supabaseDatabaseManager) {
    console.log('✅ Database manager available');
    console.log('Supabase available:', window.supabaseDatabaseManager.isSupabaseAvailable());
} else {
    console.log('❌ Database manager not found');
}

// Test 4: Test connection
console.log('\n4. Testing Connection...');
async function testConnection() {
    try {
        if (window.supabaseConfig && window.supabaseConfig.isAvailable()) {
            const client = window.supabaseConfig.getClient();
            const { data, error } = await client.from('admin_cvs').select('count').limit(1);
            
            if (error) {
                console.log('❌ Connection failed:', error.message);
                return false;
            } else {
                console.log('✅ Connection successful');
                return true;
            }
        } else {
            console.log('❌ Supabase not available');
            return false;
        }
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        return false;
    }
}

// Test 5: Test all tables
console.log('\n5. Testing Database Tables...');
async function testTables() {
    const tables = ['admin_cvs', 'shopkeeper_cvs', 'user_cvs'];
    let allWorking = true;
    
    for (const table of tables) {
        try {
            const client = window.supabaseConfig.getClient();
            const { data, error } = await client.from(table).select('*').limit(1);
            
            if (error) {
                console.log(`❌ Table ${table}: ${error.message}`);
                allWorking = false;
            } else {
                console.log(`✅ Table ${table}: Accessible`);
            }
        } catch (error) {
            console.log(`❌ Table ${table}: ${error.message}`);
            allWorking = false;
        }
    }
    
    return allWorking;
}

// Test 6: Test CV operations
console.log('\n6. Testing CV Operations...');
async function testCVOperations() {
    try {
        if (!window.supabaseDatabaseManager) {
            console.log('❌ Database manager not available');
            return false;
        }
        
        // Test save operation
        const testCV = {
            personalInfo: {
                fullName: 'Test User',
                email: 'test@example.com',
                phones: [{ phone: '1234567890' }],
                address: 'Test Address',
                summary: 'Test CV Summary'
            },
            education: [],
            experience: [],
            skills: ['JavaScript', 'HTML', 'CSS'],
            template: 'classic'
        };
        
        console.log('Testing CV save...');
        const savedCV = await window.supabaseDatabaseManager.saveCV(testCV, 'test_user', 'admin');
        
        if (savedCV) {
            console.log('✅ CV save successful');
            
            // Test load
            console.log('Testing CV load...');
            const loadedCV = await window.supabaseDatabaseManager.getCVById(savedCV.id, 'admin');
            
            if (loadedCV) {
                console.log('✅ CV load successful');
                return true;
            } else {
                console.log('❌ CV load failed');
                return false;
            }
        } else {
            console.log('❌ CV save failed');
            return false;
        }
    } catch (error) {
        console.log('❌ CV operations error:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n🚀 Running All Tests...');
    console.log('========================');
    
    const connectionTest = await testConnection();
    const tablesTest = await testTables();
    const cvTest = await testCVOperations();
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Connection: ${connectionTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Tables: ${tablesTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CV Operations: ${cvTest ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = connectionTest && tablesTest && cvTest;
    console.log(`\nOverall: ${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n✅ Your Supabase integration is working perfectly!');
        console.log('You can now use all CV Builder features with database storage.');
    } else {
        console.log('\n❌ Please check the failed tests above.');
        console.log('Make sure your Supabase project is properly configured.');
    }
    
    return { connectionTest, tablesTest, cvTest };
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.testSupabaseConnection = testConnection;
window.testSupabaseTables = testTables;
window.testSupabaseCV = testCVOperations;
window.runSupabaseTests = runAllTests;
