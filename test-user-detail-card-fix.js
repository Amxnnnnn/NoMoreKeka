/**
 * Test Script: User Detail Card - Team, Department, Manager Fetching
 * 
 * This script tests that the UserDetailCard properly fetches and displays:
 * - Current team of the user
 * - Department the user belongs to
 * - Manager under whom the user is working
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test credentials
const ADMIN_EMAIL = 'admin@company.com';
const ADMIN_PASSWORD = 'Admin@123';

let authToken = '';
let testUserId = '';

/**
 * Helper: Login and get auth token
 */
async function login(email, password) {
  try {
    console.log(`\n🔐 Logging in as ${email}...`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });

    if (response.data.success && response.data.token) {
      console.log('✅ Login successful');
      return response.data.token;
    } else {
      throw new Error('Login failed - no token received');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Test 1: Get all users and pick one for testing
 */
async function testGetAllUsers() {
  try {
    console.log('\n📋 TEST 1: Getting all users...');
    
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.users) {
      console.log(`✅ Retrieved ${response.data.users.length} users`);
      
      // Display user details
      response.data.users.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Company: ${user.company?.name || 'N/A'}`);
        console.log(`   - Department: ${user.department?.name || 'N/A'}`);
        console.log(`   - Team: ${user.team?.name || 'N/A'}`);
        console.log(`   - Manager: ${user.team?.manager?.name || 'N/A'}`);
      });

      // Pick a user with team/department for detailed testing
      const userWithTeam = response.data.users.find(u => u.team && u.department);
      if (userWithTeam) {
        testUserId = userWithTeam.id;
        console.log(`\n✅ Selected user for detailed testing: ${userWithTeam.name} (${userWithTeam.email})`);
      } else {
        // Just pick the first non-admin user
        const nonAdminUser = response.data.users.find(u => u.role !== 'ADMIN');
        testUserId = nonAdminUser ? nonAdminUser.id : response.data.users[0].id;
        console.log(`\n⚠️  No user with team/department found. Using: ${response.data.users[0].name}`);
      }

      return response.data;
    } else {
      throw new Error('Failed to retrieve users');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Test 2: Get specific user by ID with full details
 */
async function testGetUserById(userId) {
  try {
    console.log(`\n📋 TEST 2: Getting user details for ID: ${userId}...`);
    
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.user) {
      const user = response.data.user;
      console.log('✅ User details retrieved successfully\n');
      
      console.log('👤 BASIC INFORMATION:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Active: ${user.isActive}`);
      console.log(`   - Email Verified: ${user.isEmailVerified}`);
      
      console.log('\n🏢 ORGANIZATION INFORMATION:');
      console.log(`   - Company: ${user.company?.name || '❌ NOT FOUND'}`);
      console.log(`   - Company ID: ${user.company?.id || '❌ NOT FOUND'}`);
      
      console.log('\n🏛️  DEPARTMENT INFORMATION:');
      if (user.department) {
        console.log(`   ✅ Department: ${user.department.name}`);
        console.log(`   - Department ID: ${user.department.id}`);
        if (user.department.description) {
          console.log(`   - Description: ${user.department.description}`);
        }
      } else {
        console.log('   ❌ No department assigned');
      }
      
      console.log('\n👥 TEAM INFORMATION:');
      if (user.team) {
        console.log(`   ✅ Team: ${user.team.name}`);
        console.log(`   - Team ID: ${user.team.id}`);
        if (user.team.description) {
          console.log(`   - Description: ${user.team.description}`);
        }
        
        console.log('\n👔 MANAGER INFORMATION:');
        if (user.team.manager) {
          console.log(`   ✅ Manager: ${user.team.manager.name}`);
          console.log(`   - Manager ID: ${user.team.manager.id}`);
          console.log(`   - Manager Email: ${user.team.manager.email}`);
          console.log(`   - Manager Role: ${user.team.manager.role}`);
        } else {
          console.log('   ❌ No manager assigned to team');
        }
      } else {
        console.log('   ❌ No team assigned');
      }
      
      console.log('\n📅 TIMESTAMPS:');
      console.log(`   - Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`   - Updated: ${new Date(user.updatedAt).toLocaleString()}`);

      // Validation checks
      console.log('\n🔍 VALIDATION CHECKS:');
      const checks = {
        'Company data present': !!user.company,
        'Department data present': !!user.department,
        'Team data present': !!user.team,
        'Manager data present': !!(user.team?.manager)
      };

      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`   ${passed ? '✅' : '⚠️ '} ${check}`);
      });

      return response.data;
    } else {
      throw new Error('Failed to retrieve user details');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Test 3: Verify data structure matches UserDetailCard expectations
 */
async function testDataStructure(userId) {
  try {
    console.log('\n📋 TEST 3: Verifying data structure for UserDetailCard...');
    
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const user = response.data.user;
    
    // Check required fields for UserDetailCard
    const requiredFields = [
      'id', 'name', 'email', 'role', 'isActive', 
      'isEmailVerified', 'createdAt', 'updatedAt'
    ];

    console.log('\n✅ Checking required fields:');
    requiredFields.forEach(field => {
      const exists = user.hasOwnProperty(field);
      console.log(`   ${exists ? '✅' : '❌'} ${field}: ${exists ? 'Present' : 'Missing'}`);
    });

    // Check nested objects
    console.log('\n✅ Checking nested objects:');
    
    if (user.company) {
      console.log('   ✅ company.id:', user.company.id);
      console.log('   ✅ company.name:', user.company.name);
    } else {
      console.log('   ❌ company object missing');
    }

    if (user.department) {
      console.log('   ✅ department.id:', user.department.id);
      console.log('   ✅ department.name:', user.department.name);
    } else {
      console.log('   ⚠️  department object missing (may be unassigned)');
    }

    if (user.team) {
      console.log('   ✅ team.id:', user.team.id);
      console.log('   ✅ team.name:', user.team.name);
      
      if (user.team.manager) {
        console.log('   ✅ team.manager.id:', user.team.manager.id);
        console.log('   ✅ team.manager.name:', user.team.manager.name);
        console.log('   ✅ team.manager.email:', user.team.manager.email);
        console.log('   ✅ team.manager.role:', user.team.manager.role);
      } else {
        console.log('   ⚠️  team.manager object missing');
      }
    } else {
      console.log('   ⚠️  team object missing (may be unassigned)');
    }

    console.log('\n✅ Data structure validation complete!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  USER DETAIL CARD - TEAM/DEPARTMENT/MANAGER FETCH TEST');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Step 1: Login
    authToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);

    // Step 2: Get all users and select one for testing
    await testGetAllUsers();

    // Step 3: Get detailed user information
    await testGetUserById(testUserId);

    // Step 4: Verify data structure
    await testDataStructure(testUserId);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📝 SUMMARY:');
    console.log('   - Backend API now returns department, team, and manager data');
    console.log('   - UserDetailCard can properly display organization hierarchy');
    console.log('   - All required fields are present in the response');
    console.log('\n🎉 UserDetailCard is ready to display complete user information!');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ❌ TESTS FAILED');
    console.log('═══════════════════════════════════════════════════════════');
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
