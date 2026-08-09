-- Seed data for CodeArena problems (LeetCode/Codeforces style)

-- Create problems table if not exists
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    sample_input TEXT,
    sample_output TEXT,
    difficulty VARCHAR(20),
    tags VARCHAR(255),
    time_limit INTEGER DEFAULT 1000,
    memory_limit INTEGER DEFAULT 256,
    total_test_cases INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'DRAFT',
    points INTEGER DEFAULT 10,
    acceptance_rate INTEGER DEFAULT 50,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users (passwords are bcrypt hashed)
INSERT INTO users (username, email, password) VALUES
('testuser', 'test@example.com', '$2a$10$rOZjG8Y8Y8Y8Y8Y8Y8Y8YeY8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8'),
('admin', 'admin@codearena.com', '$2a$10$rOZjG8Y8Y8Y8Y8Y8Y8Y8YeY8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8')
ON CONFLICT (email) DO NOTHING;

-- Insert sample problems
INSERT INTO problems (title, slug, description, input_format, output_format, constraints, sample_input, sample_output, difficulty, tags, time_limit, memory_limit, total_test_cases, status, points, acceptance_rate, created_by, created_at, updated_at) VALUES
('Two Sum', 'two-sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'First line: n, second line: array, third line: target', 'Print two indices', '2 <= n <= 10^4', '4\n2 7 11 15\n9', '0 1', 'EASY', 'array,hash-table', 3000, 256, 10, 'PUBLISHED', 10, 45, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Add Two Numbers', 'add-two-numbers', 'Add two numbers represented as linked lists in reverse order.', 'Two lines with digits in reverse order', 'Sum in reverse order', '1 <= n <= 100', '2 4 3\n5 6 4', '7 0 8', 'MEDIUM', 'linked-list,math', 3000, 256, 15, 'PUBLISHED', 15, 35, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Longest Substring', 'longest-substring', 'Find longest substring without repeating characters.', 'Single string', 'Integer length', '0 <= s.length <= 5*10^4', 'abcabcbb', '3', 'MEDIUM', 'string,sliding-window', 3000, 256, 20, 'PUBLISHED', 20, 30, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample test cases for Two Sum
INSERT INTO test_cases (problem_id, test_case_number, input_s3_key, output_s3_key, is_sample, points, is_hidden) VALUES
(1, 1, 'two-sum/input1.txt', 'two-sum/output1.txt', true, 10, false),
(1, 2, 'two-sum/input2.txt', 'two-sum/output2.txt', true, 10, false),
(1, 3, 'two-sum/input3.txt', 'two-sum/output3.txt', false, 10, true),
(1, 4, 'two-sum/input4.txt', 'two-sum/output4.txt', false, 10, true);

-- Insert sample test cases for Add Two Numbers
INSERT INTO test_cases (problem_id, test_case_number, input_s3_key, output_s3_key, is_sample, points, is_hidden) VALUES
(2, 1, 'add-two-numbers/input1.txt', 'add-two-numbers/output1.txt', true, 15, false),
(2, 2, 'add-two-numbers/input2.txt', 'add-two-numbers/output2.txt', true, 15, false),
(2, 3, 'add-two-numbers/input3.txt', 'add-two-numbers/output3.txt', false, 15, true);

-- Insert sample editorials
INSERT INTO editorials (problem_id, explanation, approach, algorithm, complexity, code, hints, created_at, updated_at) VALUES
(1, 
'This problem can be solved using a hash map to store the complement of each number. For each number in the array, we check if its complement (target - current number) exists in the hash map. If it does, we return the indices.',
'Use a hash map to store numbers and their indices. Iterate through the array and for each number, check if (target - current number) exists in the map.',
'Hash Map / Two Pass',
'Time: O(n), Space: O(n)',
'function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}',
'Think about using a hash map to store the numbers you have seen so far.',
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP
),
(2,
'This problem can be solved by simulating the addition process digit by digit, similar to how you would add numbers on paper. We need to handle the carry from each digit addition.',
'Traverse both linked lists simultaneously, adding corresponding digits along with any carry from the previous addition. Create a new node for each digit of the result.',
'Simulation',
'Time: O(max(m,n)), Space: O(max(m,n))',
'function addTwoNumbers(l1, l2) {
    let dummy = new ListNode(0);
    let current = dummy;
    let carry = 0;
    
    while (l1 || l2 || carry) {
        const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
        carry = Math.floor(sum / 10);
        current.next = new ListNode(sum % 10);
        current = current.next;
        
        if (l1) l1 = l1.next;
        if (l2) l2 = l2.next;
    }
    
    return dummy.next;
}',
'Don''t forget to handle the carry after processing all digits.',
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP
);
