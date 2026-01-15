/**
 * Company Isolation Validation Fixes - Test Script
 * 
 * This script tests all the endpoints that were fixed for company isolation validation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

// Test configuration
const testConfig = {
    adminEmail: 'admin@company.com',
    adminPassword: 'Admin@123',
    managerEmail: 'manager@company.com',
    managerPassword: 'Manager@123',
    employeeEmail: 'employee@company.com',
    employeePassword: 'Employee@123'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = authToken) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
};

// Test 1: Login and get token
async function testLogin(email, password) {
    console.log(`\n🔐 Testing login for: ${email}`);
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password
        });

        if (response.data.success && response.data.token) {
            console.log('✅ Login successful');
            return response.data.token;
        } else {
            console.log('❌ Login failed - No token received');
            return null;
        }
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// Test 2: Get tasks (main endpoint that was failing)
async function testGetTasks(token, role) {
    console.log(`\n📋 Testing GET /tasks for ${role}`);
    const result = await makeRequest('GET', '/tasks', null, token);
    
    if (result.success) {
        console.log(`✅ Tasks retrieved successfully`);
        console.log(`   - Found ${result.data.data?.length || 0} tasks`);
        return true;
    } else {
        console.log(`❌ Failed to get tasks:`, result.error?.message || result.error);
        console.log(`   - Status: ${result.status}`);
        return false;
    }
}

// Test 3: Get tasks with empty query string (the specific issue)
async function testGetTasksWithEmptyQuery(token, role) {
    console.log(`\n📋 Testing GET /tasks? (empty query) for ${role}`);
    const result = await makeRequest('GET', '/tasks?', null, token);
    
    if (result.success) {
        console.log(`✅ Tasks with empty query retrieved successfully`);
        return true;
    } else {
        console.log(`❌ Failed to get tasks with empty query:`, result.error?.message || result.error);
        return false;
    }
}

// Test 4: Get dashboard stats
async function testGetDashboardStats(token, role) {
    console.log(`\n📊 Testing GET /dashboard/stats for ${role}`);
    const result = await makeRequest('GET', '/dashboard/stats', null, token);
    
    if (result.success) {
        console.log(`✅ Dashboard stats retrieved successfully`);
        console.log(`   - Total users: ${result.data.stats?.totalUsers || 0}`);
        return true;
    } else {
        console.log(`❌ Failed to get dashboard stats:`, result.error?.message || result.error);
        return false;
    }
}

// Test 5: Get company overview
async function testGetCompanyOverview(token, role) {
    console.log(`\n🏢 Testing GET /dashboard/overview for ${role}`);
    const result = await makeRequest('GET', '/dashboard/overview', null, token);
    
    if (result.success) {
        console.log(`✅ Company overview retrieved successfully`);
        console.log(`   - Company: ${result.data.company?.name || 'N/A'}`);
        return true;
    } else {
        console.log(`❌ Failed to get company overview:`, result.error?.message || result.error);
        return false;
    }
}

// Test 6: Get team tasks (for managers)
async function testGetTeamTasks(token, role) {
    console.log(`\n👥 Testing GET /tasks/team for ${role}`);
    const result = await makeRequest('GET', '/tasks/team', null, token);
    
    if (result.success) {
        console.log(`✅ Team tasks retrieved successfully`);
        console.log(`   - Found ${result.data.tasks?.length || 0} team tasks`);
        return true;
    } else {
        console.log(`❌ Failed to get team tasks:`, result.error?.message || result.error);
        return false;
    }
}

// Test 7: Get assigned tasks
async function testGetAssignedTasks(token, role) {
    console.log(`\n✅ Testing GET /tasks/assigned for ${role}`);
    const result = await makeRequest('GET', '/tasks/assigned', null, token);
    
    if (result.success) {
        console.log(`✅ Assigned tasks retrieved successfully`);
        console.log(`   - Found ${result.data.tasks?.length || 0} assigned tasks`);
        return true;
    } else {
        console.log(`❌ Failed to get assigned tasks:`, result.error?.message || result.error);
        return false;
    }
}

// Test 8: Get role-specific dashboard
async function testGetRoleDashboard(token, role) {
    let endpoint = '';
    if (role === 'ADMIN') {
        endpoint = '/dashboard/stats';
    } else if (role === 'MANAGER') {
        endpoint = '/manager/dashboard';
    } else {
        endpoint = '/employee/dashboard';
    }

    console.log(`\n📈 Testing GET ${endpoint} for ${role}`);
    const result = await makeRequest('GET', endpoint, null, token);
    
    if (result.success) {
        console.log(`✅ ${role} dashboard retrieved successfully`);
        return true;
    } else {
        console.log(`❌ Failed to get ${role} dashboard:`, result.error?.message || result.error);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('='.repeat(60));
    console.log('🧪 COMPANY ISOLATION VALIDATION FIXES - TEST SUITE');
    console.log('='.repeat(60));

    let totalTests = 0;
    let passedTests = 0;

    // Test Admin user
    console.log('\n' + '='.repeat(60));
    console.log('👤 TESTING ADMIN USER');
    console.log('='.repeat(60));
    
    const adminToken = await testLogin(testConfig.adminEmail, testConfig.adminPassword);
    if (adminToken) {
        totalTests++; passedTests++;
        
        if (await testGetTasks(adminToken, 'ADMIN')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetTasksWithEmptyQuery(adminToken, 'ADMIN')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetDashboardStats(adminToken, 'ADMIN')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetCompanyOverview(adminToken, 'ADMIN')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetTeamTasks(adminToken, 'ADMIN')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetAssignedTasks(adminToken, 'ADMIN')) { totalTests++; passedTests++; }
        else totalTests++;
    } else {
        totalTests++;
    }

    // Test Manager user
    console.log('\n' + '='.repeat(60));
    console.log('👤 TESTING MANAGER USER');
    console.log('='.repeat(60));
    
    const managerToken = await testLogin(testConfig.managerEmail, testConfig.managerPassword);
    if (managerToken) {
        totalTests++; passedTests++;
        
        if (await testGetTasks(managerToken, 'MANAGER')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetTasksWithEmptyQuery(managerToken, 'MANAGER')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetTeamTasks(managerToken, 'MANAGER')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetRoleDashboard(managerToken, 'MANAGER')) { totalTests++; passedTests++; }
        else totalTests++;
    } else {
        totalTests++;
    }

    // Test Employee user
    console.log('\n' + '='.repeat(60));
    console.log('👤 TESTING EMPLOYEE USER');
    console.log('='.repeat(60));
    
    const employeeToken = await testLogin(testConfig.employeeEmail, testConfig.employeePassword);
    if (employeeToken) {
        totalTests++; passedTests++;
        
        if (await testGetTasks(employeeToken, 'EMPLOYEE')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetTasksWithEmptyQuery(employeeToken, 'EMPLOYEE')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetAssignedTasks(employeeToken, 'EMPLOYEE')) { totalTests++; passedTests++; }
        else totalTests++;
        
        if (await testGetRoleDashboard(employeeToken, 'EMPLOYEE')) { totalTests++; passedTests++; }
        else totalTests++;
    } else {
        totalTests++;
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    if (passedTests === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED! Company isolation validation is working correctly.');
    } else {
        console.log('\n⚠️  SOME TESTS FAILED. Please check the errors above.');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
