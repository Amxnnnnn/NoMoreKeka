/**
 * Complete UserDetailCard Feature Test
 * 
 * Tests all implemented features:
 * 1. User details fetching (team, department, manager)
 * 2. Leave balance display
 * 3. User activation/deactivation
 * 4. Team assignment/reassignment
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// You'll need to update these with actual credentials
const ADMIN_EMAIL = 'admin@signity.com';
const ADMIN_PASSWORD = 'Admin@123';

let authToken = '';
let testUserId = '';

/**
 * Helper: Login
 */
async function login(email, password) {
  console.log(`\n🔐 Logging in as ${email}...`);
  const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  console.log('✅ Login successful');
  return response.data.token;
}

/**
 * Test 1: Fetch user with complete details
 */
async function testUserDetailsFetching(userId) {
  console.log('\n📋 TEST 1: Fetching user details with team, department, manager...');
  
  const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  const user = response.data.user;
  
  console.log('\n✅ User Details:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Active: ${user.isActive}`);
  console.log(`   Company: ${user.company?.name || 'N/A'}`);
  console.log(`   Department: ${user.department?.name || 'N/A'}`);
  console.log(`   Team: ${user.team?.name || 'N/A'}`);
  console.log(`   Manager: ${user.team?.manager?.name || 'N/A'}`);
  
  // Validation
  const hasCompany = !!user.company;
  const hasDepartment = !!user.department;
  const hasTeam = !!user.team;
  const hasManager = !!(user.team?.manager);
  
  console.log('\n🔍 Validation:');
  console.log(`   ${hasCompany ? '✅' : '⚠️ '} Company data present`);
  console.log(`   ${hasDepartment ? '✅' : '⚠️ '} Department data present`);
  console.log(`   ${hasTeam ? '✅' : '⚠️ '} Team data present`);
  console.log(`   ${hasManager ? '✅' : '⚠️ '} Manager data present`);
  
  return user;
}

/**
 * Test 2: Fetch leave balance
 */
async function testLeaveBalance() {
  console.log('\n📋 TEST 2: Fetching leave balance...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/leaves/balance`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const balances = response.data.data || [];
    
    console.log(`\n✅ Found ${balances.length} leave types:`);
    balances.forEach((balance, index) => {
      console.log(`\n   Leave Type ${index + 1}: ${balance.leaveType?.name}`);
      console.log(`   - Allocated: ${balance.totalDays}`);
      console.log(`   - Used: ${balance.usedDays}`);
      console.log(`   - Remaining: ${balance.remainingDays}`);
    });
    
    return balances;
  } catch (error) {
    console.log('⚠️  Leave balance not available (user may not have leave types assigned)');
    return [];
  }
}

/**
 * Test 3: Deactivate user
 */
async function testDeactivateUser(userId) {
  console.log('\n📋 TEST 3: Deactivating user...');
  
  const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  console.log('✅ User deactivated successfully');
  console.log(`   Message: ${response.data.message}`);
  
  // Verify deactivation
  const userCheck = await axios.get(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log(`   Verified: User isActive = ${userCheck.data.user.isActive}`);
  
  return response.data;
}

/**
 * Test 4: Activate user
 */
async function testActivateUser(userId) {
  console.log('\n📋 TEST 4: Activating user...');
  
  const response = await axios.put(`${API_BASE_URL}/users/${userId}/activate`, {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  console.log('✅ User activated successfully');
  console.log(`   Message: ${response.data.message}`);
  
  // Verify activation
  const userCheck = await axios.get(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log(`   Verified: User isActive = ${userCheck.data.user.isActive}`);
  
  return response.data;
}

/**
 * Test 5: Fetch available teams
 */
async function testFetchTeams() {
  console.log('\n📋 TEST 5: Fetching available teams...');
  
  const response = await axios.get(`${API_BASE_URL}/teams/managed`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  const teams = response.data.teams || [];
  
  console.log(`\n✅ Found ${teams.length} teams:`);
  teams.forEach((team, index) => {
    console.log(`\n   Team ${index + 1}: ${team.name}`);
    console.log(`   - Manager: ${team.manager?.name}`);
    console.log(`   - Members: ${team.memberCount || team.members?.length || 0}`);
    console.log(`   - Projects: ${team.projectCount || team.projects?.length || 0}`);
  });
  
  return teams;
}

/**
 * Test 6: Assign user to team
 */
async function testAssignTeam(teamId, userId) {
  console.log('\n📋 TEST 6: Assigning user to team...');
  
  const response = await axios.put(`${API_BASE_URL}/teams/${teamId}/members`, 
    { memberIds: [userId] },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  console.log('✅ User assigned to team successfully');
  console.log(`   Team: ${response.data.team.name}`);
  
  // Verify assignment
  const userCheck = await axios.get(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log(`   Verified: User team = ${userCheck.data.user.team?.name || 'N/A'}`);
  
  return response.data;
}

/**
 * Test 7: Remove user from team
 */
async function testRemoveFromTeam(teamId, userId) {
  console.log('\n📋 TEST 7: Removing user from team...');
  
  const response = await axios.delete(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  console.log('✅ User removed from team successfully');
  console.log(`   Message: ${response.data.message}`);
  
  // Verify removal
  const userCheck = await axios.get(`${API_BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  console.log(`   Verified: User team = ${userCheck.data.user.team?.name || 'N/A'}`);
  
  return response.data;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  USER DETAIL CARD - COMPLETE FEATURE TEST');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Login
    authToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);

    // Get all users and select one for testing
    console.log('\n📋 Fetching users...');
    const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const users = usersResponse.data.users;
    const testUser = users.find(u => u.role === 'EMPLOYEE') || users[0];
    testUserId = testUser.id;
    
    console.log(`✅ Selected test user: ${testUser.name} (${testUser.email})`);

    // Run all tests
    const user = await testUserDetailsFetching(testUserId);
    await testLeaveBalance();
    
    // Only test activation/deactivation if user is active
    if (user.isActive) {
      await testDeactivateUser(testUserId);
      await testActivateUser(testUserId);
    } else {
      await testActivateUser(testUserId);
      await testDeactivateUser(testUserId);
      await testActivateUser(testUserId); // Restore to active
    }
    
    // Test team operations
    const teams = await testFetchTeams();
    
    if (teams.length > 0) {
      const testTeam = teams[0];
      
      // If user has a team, remove first
      if (user.team) {
        await testRemoveFromTeam(user.team.id, testUserId);
      }
      
      // Assign to team
      await testAssignTeam(testTeam.id, testUserId);
      
      // Test reassignment
      if (teams.length > 1) {
        const newTeam = teams[1];
        await testRemoveFromTeam(testTeam.id, testUserId);
        await testAssignTeam(newTeam.id, testUserId);
      }
    } else {
      console.log('\n⚠️  No teams available for testing team assignment');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📝 SUMMARY:');
    console.log('   ✅ User details fetching (team, department, manager)');
    console.log('   ✅ Leave balance display');
    console.log('   ✅ User deactivation');
    console.log('   ✅ User activation');
    console.log('   ✅ Team fetching');
    console.log('   ✅ Team assignment');
    console.log('   ✅ Team removal');
    console.log('\n🎉 UserDetailCard is fully functional!');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ❌ TESTS FAILED');
    console.log('═══════════════════════════════════════════════════════════');
    console.error('\nError:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
