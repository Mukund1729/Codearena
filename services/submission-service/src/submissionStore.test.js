const { createSubmissionStore } = require('./submissionStore');

describe('createSubmissionStore', () => {
  it('stores submissions in memory when the database is unavailable', async () => {
    const store = createSubmissionStore();
    const submission = {
      submissionId: 'submission-1',
      userId: 'user-1',
      problemId: 1,
      contestId: null,
      language: 'python',
      code: 'print(1)',
      status: 'PENDING'
    };

    await store.create(submission);

    expect(await store.getById('submission-1')).toMatchObject({
      submissionId: 'submission-1',
      status: 'PENDING'
    });
  });
});
