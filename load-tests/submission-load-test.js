import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('submission_errors');
const submissionTime = new Trend('submission_time');
const executionTime = new Trend('execution_time');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    http_req_failed: ['rate<0.05'], // Error rate < 5%
    submission_errors: ['rate<0.05'],
    submission_time: ['p(95)<30000'], // 95% of submissions complete in 30s
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

const codeSnippets = {
  python: `print("Hello, World!")`,
  java: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  javascript: `console.log("Hello, World!");`,
};

export function setup() {
  // Register and login
  const username = `loadtest_${__VU}_${Date.now()}`;
  const email = `${username}@test.com`;
  
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
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

  const languages = ['python', 'java', 'cpp', 'javascript'];
  const language = languages[Math.floor(Math.random() * languages.length)];

  const submissionPayload = JSON.stringify({
    problemId: 1,
    language: language,
    code: codeSnippets[language],
  });

  const startTime = Date.now();

  // Submit code
  const submitRes = http.post(`${BASE_URL}/api/submissions`, submissionPayload, { headers });
  
  check(submitRes, {
    'submission created': (r) => r.status === 200 || r.status === 201,
    'has submission ID': (r) => r.json('submissionId') !== undefined,
  }) || errorRate.add(1);

  if (submitRes.status === 200 || submitRes.status === 201) {
    const submissionId = submitRes.json('submissionId');

    // Poll for result
    let result = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait time

    while (!result && attempts < maxAttempts) {
      sleep(1);
      const resultRes = http.get(`${BASE_URL}/api/submissions/${submissionId}`, { headers });
      
      if (resultRes.status === 200) {
        const status = resultRes.json('status');
        if (status === 'ACCEPTED' || status === 'WRONG_ANSWER' || status === 'RUNTIME_ERROR') {
          result = resultRes.json();
          const totalTime = Date.now() - startTime;
          submissionTime.add(totalTime);
          
          if (result.executionTime) {
            executionTime.add(result.executionTime);
          }
          
          check(result, {
            'submission completed': (r) => r.status !== 'PENDING' && r.status !== 'RUNNING',
          });
        }
      }
      attempts++;
    }

    if (!result) {
      console.error(`Submission ${submissionId} did not complete in time`);
      errorRate.add(1);
    }
  }

  // Rate limit: wait 30 seconds between submissions
  sleep(30);
}

export function teardown(data) {
  // Cleanup if needed
}
