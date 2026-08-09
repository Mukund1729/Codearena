import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('contest_errors');
const leaderboardUpdates = new Counter('leaderboard_updates');
const submissionTime = new Trend('contest_submission_time');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users (contest start)
    { duration: '30m', target: 100 }, // Contest duration - steady state
    { duration: '5m', target: 0 },    // Ramp down (contest end)
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.02'],
    contest_errors: ['rate<0.02'],
    leaderboard_updates: ['count>0'], // At least some leaderboard updates
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const CONTEST_ID = __ENV.CONTEST_ID || '1';

const codeSnippets = {
  python: `def solve():
    n = int(input())
    for i in range(n):
        print(i)
solve()`,
  java: `import java.util.*;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) {
            System.out.println(i);
        }
    }
}`,
  cpp: `#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    for (int i = 0; i < n; i++) {
        cout << i << endl;
    }
    return 0;
}`,
};

export function setup() {
  const username = `contest_user_${__VU}_${Date.now()}`;
  const email = `${username}@test.com`;
  
  // Register
  http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    username,
    email,
    password: 'testpassword123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email,
    password: 'testpassword123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { token: loginRes.json('token'), username };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Simulate contest behavior
  const actions = ['submit', 'check_leaderboard', 'view_problem'];
  const action = actions[Math.floor(Math.random() * actions.length)];

  switch (action) {
    case 'submit':
      submitCode(data, headers);
      break;
    case 'check_leaderboard':
      checkLeaderboard(headers);
      break;
    case 'view_problem':
      viewProblem(headers);
      break;
  }

  // Random sleep between actions (1-5 seconds)
  sleep(Math.random() * 4 + 1);
}

function submitCode(data, headers) {
  const languages = ['python', 'java', 'cpp'];
  const language = languages[Math.floor(Math.random() * languages.length)];
  const problemId = Math.floor(Math.random() * 3) + 1; // Problems 1-3

  const startTime = Date.now();

  const submitRes = http.post(`${BASE_URL}/api/submissions`, JSON.stringify({
    problemId,
    language,
    code: codeSnippets[language],
  }), { headers });

  check(submitRes, {
    'submission created': (r) => r.status === 200 || r.status === 201,
  }) || errorRate.add(1);

  if (submitRes.status === 200 || submitRes.status === 201) {
    const submissionId = submitRes.json('submissionId');

    // Poll for result
    let result = null;
    let attempts = 0;
    const maxAttempts = 20;

    while (!result && attempts < maxAttempts) {
      sleep(1);
      const resultRes = http.get(`${BASE_URL}/api/submissions/${submissionId}`, { headers });
      
      if (resultRes.status === 200) {
        const status = resultRes.json('status');
        if (status === 'ACCEPTED' || status === 'WRONG_ANSWER') {
          result = resultRes.json();
          const totalTime = Date.now() - startTime;
          submissionTime.add(totalTime);
          
          if (status === 'ACCEPTED') {
            leaderboardUpdates.add(1);
          }
        }
      }
      attempts++;
    }
  }
}

function checkLeaderboard(headers) {
  const leaderboardRes = http.get(`${BASE_URL}/api/contests/${CONTEST_ID}/leaderboard`, { headers });
  
  check(leaderboardRes, {
    'leaderboard retrieved': (r) => r.status === 200,
    'leaderboard has data': (r) => r.json().length > 0,
  }) || errorRate.add(1);
}

function viewProblem(headers) {
  const problemId = Math.floor(Math.random() * 3) + 1;
  const problemRes = http.get(`${BASE_URL}/api/problems/${problemId}`, { headers });
  
  check(problemRes, {
    'problem retrieved': (r) => r.status === 200,
  }) || errorRate.add(1);
}

export function teardown(data) {
  // Final leaderboard check
  const headers = {
    'Authorization': `Bearer ${data.token}`,
  };
  
  const finalLeaderboard = http.get(`${BASE_URL}/api/contests/${CONTEST_ID}/leaderboard`, { headers });
  console.log(`Final leaderboard entries: ${finalLeaderboard.json().length}`);
}
