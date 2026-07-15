class SubmissionStore {
  constructor() {
    this.submissions = new Map();
  }

  async create(submission) {
    this.submissions.set(submission.submissionId, { ...submission });
    return submission;
  }

  async getById(submissionId) {
    return this.submissions.get(submissionId) || null;
  }

  async listByUser(userId) {
    return Array.from(this.submissions.values()).filter((submission) => submission.userId === userId);
  }
}

function createSubmissionStore() {
  return new SubmissionStore();
}

module.exports = { createSubmissionStore };
