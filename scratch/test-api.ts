import fs from 'fs';
import path from 'path';

const BASE_URL = process.argv.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';

async function test() {
  console.log(`Starting API verification tests against ${BASE_URL}...`);

  let adminToken = '';
  
  // 1. Try to login as Admin
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    const body = await res.json();
    if (!res.ok || !body.success) {
      console.error('Failed to log in as admin. Please ensure you ran the promote-user.ts script and the server is running.');
      console.error('Response details:', body);
      process.exit(1);
    }
    
    adminToken = body.token;
    console.log('✓ Successfully logged in as admin.');
  } catch (err: any) {
    console.error(`Error connecting to server at ${BASE_URL}:`, err.message);
    console.error('Please ensure the Next.js dev server is running (npm run dev).');
    process.exit(1);
  }

  const authHeader = { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  // 2. Test 401 Unauthorized when no token is provided
  {
    console.log('\nTesting GET /api/v1/admin/users (unauthorized)...');
    const res = await fetch(`${BASE_URL}/api/v1/admin/users`);
    const body = await res.json();
    if (res.status === 401 && !body.success) {
      console.log('✓ Correctly rejected unauthorized request with 401.');
    } else {
      console.error(`✗ Expected 401, but got ${res.status}:`, body);
      process.exit(1);
    }
  }

  // 3. Test GET list as admin
  let totalUsersBefore = 0;
  {
    console.log('\nTesting GET /api/v1/admin/users (authorized admin)...');
    const res = await fetch(`${BASE_URL}/api/v1/admin/users`, { headers: authHeader });
    const body = await res.json();
    if (res.ok && Array.isArray(body.data) && body.meta) {
      console.log('✓ Successfully fetched user list with metadata.');
      console.log('Metadata returned:', body.meta);
      totalUsersBefore = body.meta.total;
    } else {
      console.error('✗ Failed to fetch user list:', body);
      process.exit(1);
    }
  }

  // 4. Test POST create user as admin
  const testEmail = `testuser_${Date.now()}@example.com`;
  let createdUserId = '';
  {
    console.log(`\nTesting POST /api/v1/admin/users (create user)...`);
    const res = await fetch(`${BASE_URL}/api/v1/admin/users`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        name: 'Testy Tester',
        email: testEmail,
        password: 'testpassword123',
        role: 'user'
      })
    });
    const body = await res.json();
    if (res.status === 201 && body.success && body.data) {
      console.log(`✓ User created successfully with ID: ${body.data._id || body.data.id}`);
      createdUserId = body.data._id || body.data.id;
      if (body.data.password) {
        console.error('✗ Password field was returned in response!');
        process.exit(1);
      }
    } else {
      console.error('✗ Failed to create user:', body);
      process.exit(1);
    }
  }

  // 5. Test duplicate email validation
  {
    console.log('\nTesting POST /api/v1/admin/users (duplicate email validation)...');
    const res = await fetch(`${BASE_URL}/api/v1/admin/users`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        name: 'Another Name',
        email: testEmail,
        password: 'anotherpassword123',
        role: 'user'
      })
    });
    const body = await res.json();
    if (res.status === 400 && !body.success) {
      console.log('✓ Correctly rejected duplicate email with 400 Bad Request:', body.message);
    } else {
      console.error(`✗ Expected 400, but got ${res.status}:`, body);
      process.exit(1);
    }
  }

  // 6. Test GET one user by ID
  {
    console.log(`\nTesting GET /api/v1/admin/users/${createdUserId}...`);
    const res = await fetch(`${BASE_URL}/api/v1/admin/users/${createdUserId}`, { headers: authHeader });
    const body = await res.json();
    if (res.ok && body.success && body.data) {
      console.log('✓ Successfully retrieved user data:', body.data.name, body.data.email);
    } else {
      console.error(`✗ Failed to retrieve user by ID:`, body);
      process.exit(1);
    }
  }

  // 7. Test PUT/PATCH update user by ID
  const updatedName = 'Updated Testy Tester';
  const updatedEmail = `updated_${testEmail}`;
  {
    console.log(`\nTesting PATCH /api/v1/admin/users/${createdUserId}...`);
    const res = await fetch(`${BASE_URL}/api/v1/admin/users/${createdUserId}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({
        name: updatedName,
        email: updatedEmail,
        role: 'admin' // promote to admin!
      })
    });
    const body = await res.json();
    if (res.ok && body.success && body.data) {
      console.log('✓ User updated successfully.');
      if (body.data.name === updatedName && body.data.email === updatedEmail && body.data.role === 'admin') {
        console.log('✓ Fields verify correct update values.');
      } else {
        console.error('✗ Fields do not match updated values:', body.data);
        process.exit(1);
      }
    } else {
      console.error('✗ Failed to update user:', body);
      process.exit(1);
    }
  }

  // 8. Test search functionality
  {
    console.log(`\nTesting search filter on user lists (?search=${updatedName})...`);
    const res = await fetch(`${BASE_URL}/api/v1/admin/users?search=${encodeURIComponent(updatedName)}`, { headers: authHeader });
    const body = await res.json();
    if (res.ok && Array.isArray(body.data)) {
      const found = body.data.some((u: any) => (u._id || u.id) === createdUserId);
      if (found) {
        console.log('✓ Successfully located user in list search.');
      } else {
        console.error('✗ User was not found in list search results:', body.data);
        process.exit(1);
      }
    } else {
      console.error('✗ Failed to search users:', body);
      process.exit(1);
    }
  }

  // 9. Test pagination limit
  {
    console.log('\nTesting pagination limits (?page=1&limit=1)...');
    const res = await fetch(`${BASE_URL}/api/v1/admin/users?page=1&limit=1`, { headers: authHeader });
    const body = await res.json();
    if (res.ok && Array.isArray(body.data) && body.data.length <= 1) {
      console.log('✓ Paginated list correctly restricted to page size limit.');
    } else {
      console.error('✗ Pagination limit failed to restrict records:', body);
      process.exit(1);
    }
  }

  // 10. Test DELETE user by ID
  {
    console.log(`\nTesting DELETE /api/v1/admin/users/${createdUserId}...`);
    const res = await fetch(`${BASE_URL}/api/v1/admin/users/${createdUserId}`, {
      method: 'DELETE',
      headers: authHeader
    });
    const body = await res.json();
    if (res.ok && body.success) {
      console.log('✓ User deleted successfully.');
    } else {
      console.error('✗ Failed to delete user:', body);
      process.exit(1);
    }
  }

  // 11. Verify GET one returns 404 for deleted user
  {
    console.log(`\nTesting GET /api/v1/admin/users/${createdUserId} (post-delete verification)...`);
    const res = await fetch(`${BASE_URL}/api/v1/admin/users/${createdUserId}`, { headers: authHeader });
    const body = await res.json();
    if (res.status === 404 && !body.success) {
      console.log('✓ Correctly returned 404 for deleted user ID.');
    } else {
      console.error(`✗ Expected 404, but got ${res.status}:`, body);
      process.exit(1);
    }
  }

  console.log('\n=============================================');
  console.log('🎉 ALL ADMIN USER BACKEND API TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('=============================================\n');
}

test().catch(err => {
  console.error('Unexpected error in runner:', err);
  process.exit(1);
});
