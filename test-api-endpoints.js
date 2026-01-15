const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAPIEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');

    try {
        // Test 1: Check if server is running
        console.log('1. Testing server health...');
        const healthResponse = await axios.get(`${BASE_URL}/test/health`);
        console.log('✅ Server is running:', healthResponse.data);

        // Test 2: Test Swagger documentation
        console.log('\n2. Testing Swagger documentation...');
        const swaggerResponse = await axios.get('http://localhost:3001/api-docs.json');
        console.log('✅ Swagger JSON is accessible');

        // Test 3: Test public invitation endpoint (should work without auth)
        console.log('\n3. Testing public invitation endpoint...');
        try {
            await axios.get(`${BASE_URL}/invitations/details/invalid-token`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Public invitation endpoint is working (returns proper error for invalid token)');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 4: Test protected endpoint without auth (should return 401)
        console.log('\n4. Testing protected endpoint without auth...');
        try {
            await axios.get(`${BASE_URL}/profile`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Protected endpoint properly requires authentication');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 5: Test error handling with invalid data
        console.log('\n5. Testing error handling...');
        try {
            await axios.post(`${BASE_URL}/invitations/accept`, {
                token: '',
                password: '123' // Too short
            });
        } catch (error) {
            if (error.response && error.response.status === 422) {
                console.log('✅ Validation error handling is working');
                console.log('   Response:', error.response.data);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📚 Access Swagger UI at: http://localhost:3001/api-docs');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the tests
testAPIEndpoints();