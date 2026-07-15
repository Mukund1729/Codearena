import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('stress_errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Quick ramp up
    { duration: '2m', target: 500 },   // High load
    { duration: '2m', target: 1000 },  // Extreme load
    { duration: '2m', target: 500 },   // Scale down
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // More lenient during stress
    http_req_failed: ['rate<0.1'],     // Allow 10% error rate
    stress_errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
  const username = `stress_user_${__VU}_${Date.now()}`;
  const email = `${username}@test.com`;
  
  http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    username,
    email,
    password: 'testpassword123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email,
    password: 'testpassword123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { token: loginRes.json('token') };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Rapid fire requests
  const endpoints = [
    () => http.get(`${BASE_URL}/api/problems`, { headers }),
    () => http.get(`${BASE_URL}/api/problems/1`, { headers }),
    () => http.get(`${BASE_URL}/api/contests`, { headers }),
    () => http.get(`${BASE_URL}/api/contests/1/leaderboard`, { headers }),
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = endpoint();

  check(res, {
    'status < 500': (r) => r.status < 500,
  }) || errorRate.add(1);

  // Minimal sleep to simulate burst traffic
  sleep(0.1);
}
