-- Seed data for CodeArena problems (LeetCode/Codeforces style)

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
(
    'Two Sum',
    'two-sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    'The first line contains an integer n (1 ≤ n ≤ 10^4) - the size of the array.
The second line contains n space-separated integers representing the array elements.
The third line contains an integer target - the target sum.',
    'Print two space-separated integers representing the indices of the two numbers that add up to target.',
    '2 ≤ nums.length ≤ 10^4
-10^9 ≤ nums[i] ≤ 10^9
-10^9 ≤ target ≤ 10^9
Only one valid answer exists.',
    '4
2 7 11 15
9',
    '0 1',
    'EASY',
    'array,hash-table',
    3000,
    256,
    10,
    'PUBLISHED',
    10,
    45,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Add Two Numbers',
    'add-two-numbers',
    'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    'The first line contains space-separated digits of the first number (in reverse order).
The second line contains space-separated digits of the second number (in reverse order).',
    'Print the sum as space-separated digits in reverse order.',
    'The number of nodes in each linked list is in the range [1, 100].
0 <= Node.val <= 9
It is guaranteed that the list represents a number that does not have leading zeros.',
    '2 4 3
5 6 4',
    '7 0 8',
    'MEDIUM',
    'linked-list,math',
    3000,
    256,
    15,
    'PUBLISHED',
    15,
    35,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Longest Substring Without Repeating Characters',
    'longest-substring-without-repeating-characters',
    'Given a string s, find the length of the longest substring without repeating characters.',
    'A single line containing the string s.',
    'Print a single integer - the length of the longest substring without repeating characters.',
    '0 <= s.length <= 5 * 10^4
s consists of English letters, digits, symbols and spaces.',
    'abcabcbb',
    '3',
    'MEDIUM',
    'string,sliding-window',
    3000,
    256,
    20,
    'PUBLISHED',
    20,
    30,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Median of Two Sorted Arrays',
    'median-of-two-sorted-arrays',
    'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    'The first line contains two integers m and n - sizes of the two arrays.
The second line contains m space-separated integers - the first array.
The third line contains n space-separated integers - the second array.',
    'Print the median of the two sorted arrays.',
    'nums1.length == m
nums2.length == n
0 <= m <= 1000
0 <= n <= 1000
1 <= m + n <= 2000
-10^6 <= nums1[i], nums2[i] <= 10^6',
    '2 2
1 3
2',
    '2.0',
    'HARD',
    'array,binary-search,divide-and-conquer',
    5000,
    256,
    25,
    'PUBLISHED',
    30,
    25,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Longest Palindromic Substring',
    'longest-palindromic-substring',
    'Given a string s, return the longest palindromic substring in s.',
    'A single line containing the string s.',
    'Print the longest palindromic substring.',
    '1 <= s.length <= 1000
s consists of only digits and English letters.',
    'babad',
    'bab',
    'MEDIUM',
    'string,dynamic-programming',
    3000,
    256,
    15,
    'PUBLISHED',
    20,
    28,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Container With Most Water',
    'container-with-most-water',
    'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.',
    'The first line contains an integer n - the size of the array.
The second line contains n space-separated integers representing the heights.',
    'Print a single integer - the maximum amount of water that can be stored.',
    'n == height.length
2 <= n <= 10^5
0 <= height[i] <= 10^4',
    '9
1 8 6 2 5 4 8 3 7',
    '49',
    'MEDIUM',
    'array,two-pointers,greedy',
    3000,
    256,
    20,
    'PUBLISHED',
    25,
    40,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '3Sum',
    '3sum',
    'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.',
    'The first line contains an integer n - the size of the array.
The second line contains n space-separated integers.',
    'Print all unique triplets that sum to zero, each on a new line as space-separated values.',
    '0 <= nums.length <= 3000
-10^5 <= nums[i] <= 10^5',
    '6
-1 0 1 2 -1 -4',
    '-1 -1 2
-1 0 1',
    'MEDIUM',
    'array,two-pointers,sorting',
    3000,
    256,
    25,
    'PUBLISHED',
    25,
    32,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Valid Parentheses',
    'valid-parentheses',
    'Given a string s containing just the characters ''(''', ''')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.',
    'A single line containing the string s.',
    'Print "true" if the string is valid, otherwise print "false".',
    '1 <= s.length <= 10^4
s consists of parentheses only ''()[]{}''.',
    '()',
    'true',
    'EASY',
    'string,stack',
    2000,
    256,
    10,
    'PUBLISHED',
    10,
    50,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Merge Two Sorted Lists',
    'merge-two-sorted-lists',
    'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.',
    'The first line contains space-separated integers of the first sorted list.
The second line contains space-separated integers of the second sorted list.',
    'Print the merged sorted list as space-separated integers.',
    'The number of nodes in both lists is in the range [0, 50].
-100 <= Node.val <= 100
Both list1 and list2 are sorted in non-decreasing order.',
    '1 2 4
1 3 4',
    '1 1 2 3 4 4',
    'EASY',
    'linked-list,recursion',
    2000,
    256,
    10,
    'PUBLISHED',
    10,
    55,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Search in Rotated Sorted Array',
    'search-in-rotated-sorted-array',
    'There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated at an unknown pivot index k. Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.',
    'The first line contains an integer n - the size of the array.
The second line contains n space-separated integers (rotated sorted array).
The third line contains an integer target.',
    'Print the index of target if found, otherwise print -1.',
    '1 <= nums.length <= 5000
-10^4 <= nums[i] <= 10^4
All values of nums are unique.
nums is an ascending array that is possibly rotated.
-10^4 <= target <= 10^4',
    '7
4 5 6 7 0 1 2
0',
    '4',
    'MEDIUM',
    'array,binary-search',
    3000,
    256,
    20,
    'PUBLISHED',
    20,
    35,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

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
