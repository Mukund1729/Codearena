import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
  // Register a test user
  const registerPayload = JSON.stringify({
    username: `testuser_${__VU}`,
    email: `testuser_${__VU}@test.com`,
    password: 'testpassword123',
  });

  const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerRes.status !== 200) {
    console.error('Failed to register user:', registerRes.status);
  }

  // Login to get token
  const loginPayload = JSON.stringify({
    email: `testuser_${__VU}@test.com`,
    password: 'testpassword123',
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    console.error('Failed to login:', loginRes.status);
    return { token: null };
  }

  return { token: loginRes.json('token') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Test 1: Get all problems
  const problemsRes = http.get(`${BASE_URL}/api/problems`, { headers });
  check(problemsRes, {
    'problems status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get specific problem
  const problemRes = http.get(`${BASE_URL}/api/problems/1`, { headers });
  check(problemRes, {
    'problem detail status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get all contests
  const contestsRes = http.get(`${BASE_URL}/api/contests`, { headers });
  check(contestsRes, {
    'contests status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Get leaderboard
  const leaderboardRes = http.get(`${BASE_URL}/api/contests/1/leaderboard`, { headers });
  check(leaderboardRes, {
    'leaderboard status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
}
