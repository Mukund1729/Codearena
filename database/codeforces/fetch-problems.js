const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Codeforces API base URL
const CODEFORCES_API_BASE = 'https://codeforces.com/api';

// Difficulty mapping based on Codeforces rating
function mapDifficulty(rating) {
  if (!rating) return 'MEDIUM';
  if (rating <= 1200) return 'EASY';
  if (rating <= 1600) return 'MEDIUM';
  return 'HARD';
}

// Map Codeforces tags to our tags
function mapTags(codeforcesTags) {
  const tagMap = {
    'dp': 'dynamic-programming',
    'graphs': 'graph-theory',
    'math': 'math',
    'strings': 'string',
    'greedy': 'greedy',
    'binary search': 'binary-search',
    'sortings': 'sorting',
    'data structures': 'data-structures',
    'number theory': 'number-theory',
    'geometry': 'geometry',
    'combinatorics': 'combinatorics',
    'brute force': 'brute-force',
    'divide and conquer': 'divide-and-conquer',
    'recursion': 'recursion',
    'backtracking': 'backtracking',
    'bitmasks': 'bit-manipulation',
    'hashing': 'hash-table',
    'trees': 'tree',
    'trie': 'trie',
    'dfs': 'depth-first-search',
    'bfs': 'breadth-first-search',
    'two pointers': 'two-pointers',
  };
  
  return codeforcesTags
    .map(tag => tagMap[tag.toLowerCase()] || tag.toLowerCase().replace(/\s+/g, '-'))
    .join(',');
}

// Convert Codeforces problem to our format
function convertCodeforcesProblem(cfProblem, contestId) {
  const rating = cfProblem.rating || 1500;
  const problemId = `${contestId}${cfProblem.index}`;
  
  return {
    id: problemId,
    title: cfProblem.name,
    slug: `${contestId}-${cfProblem.index.toLowerCase()}`,
    description: `Solve problem ${cfProblem.index} from Codeforces Round ${contestId}.`,
    input_format: 'Standard input',
    output_format: 'Standard output',
    constraints: `Time limit: ${cfProblem.timeLimit || 1} second, Memory limit: ${cfProblem.memoryLimit || 256} MB`,
    sample_input: 'See problem statement on Codeforces',
    sample_output: 'See problem statement on Codeforces',
    difficulty: mapDifficulty(rating),
    tags: mapTags(cfProblem.tags || []),
    time_limit: (cfProblem.timeLimit || 1) * 1000,
    memory_limit: cfProblem.memoryLimit || 256,
    total_test_cases: 10,
    status: 'PUBLISHED',
    points: Math.round(rating / 100),
    acceptance_rate: Math.max(10, Math.min(90, 100 - Math.round(rating / 20))),
    created_by: 'codeforces-import',
    source: 'Codeforces',
    url: `https://codeforces.com/problemset/problem/${contestId}/${cfProblem.index}`,
    rating: rating
  };
}

// Fetch problems from Codeforces
async function fetchCodeforcesProblems(limit = 20) {
  try {
    console.log(`Fetching problems from Codeforces...`);
    
    // Use problemset API to get all problems
    const problemsResponse = await axios.get(`${CODEFORCES_API_BASE}/problemset.problems`, {
      params: {
        tags: ''
      }
    });

    const problems = problemsResponse.data.result?.problems || [];
    console.log(`Found ${problems.length} problems in problemset`);

    // Get the first N problems
    const selectedProblems = problems.slice(0, limit);
    
    // Add contest IDs (we'll use a default or extract from problem metadata)
    const problemsWithContest = selectedProblems.map(p => ({
      ...p,
      contestId: p.contestId || 1000 // Default contest ID if not available
    }));

    console.log(`Selected ${problemsWithContest.length} problems`);
    return problemsWithContest;
  } catch (error) {
    console.error('Error fetching Codeforces problems:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 500;
  const outputFile = path.join(__dirname, 'codeforces-problems.json');
  
  try {
    console.log('Fetching authentic Codeforces problems...\n');
    const problems = await fetchCodeforcesProblems(limit);
    
    const convertedProblems = problems.map(p => convertCodeforcesProblem(p, p.contestId));
    
    // Save to JSON file
    fs.writeFileSync(outputFile, JSON.stringify(convertedProblems, null, 2));
    console.log(`\n✅ Saved ${convertedProblems.length} problems to ${outputFile}`);
    
    // Show summary
    console.log('\n📊 Problems fetched:');
    convertedProblems.forEach(p => {
      console.log(`- ${p.title} (${p.difficulty}) [Rating: ${p.rating}]`);
      console.log(`  Tags: ${p.tags}`);
      console.log(`  Source: ${p.url}`);
    });

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
