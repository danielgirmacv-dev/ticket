const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

const laravelClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

async function testLogin() {
    try {
        console.log('Testing login...');
        const response = await laravelClient.post('/login', {
            email: 'admin@example.com',
            password: 'password',
        });

        console.log('✅ Login successful!');
        console.log('Status:', response.status);
        console.log('Token:', response.data.token);
        console.log('User:', response.data.user.email);
        console.log('Profile:', response.data.user.profile ? 'Present' : 'Missing');
        console.log('Roles:', response.data.user.roles?.map(r => r.name).join(', '));

    } catch (error) {
        console.log('❌ Login failed!');
        console.log('Error message:', error.message);
        console.log('Response status:', error.response?.status);
        console.log('Response data:', JSON.stringify(error.response?.data, null, 2));
        console.log('Full error:', error);
    }
}

testLogin();
