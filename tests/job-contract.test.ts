import { describe, it, expect, beforeEach } from 'vitest';

describe('Job Contract', () => {
  let mockStorage: Map<string, any>;
  let jobIdNonce: number;
  
  beforeEach(() => {
    mockStorage = new Map();
    jobIdNonce = 0;
  });
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case 'post-job':
        const [title, description, budget] = args;
        jobIdNonce++;
        mockStorage.set(`job-${jobIdNonce}`, {
          client: sender,
          freelancer: null,
          title,
          description,
          budget,
          status: 'OPEN'
        });
        return { success: true, value: jobIdNonce };
      case 'apply-for-job':
        const [jobId] = args;
        const job = mockStorage.get(`job-${jobId}`);
        if (!job || job.status !== 'OPEN') return { success: false, error: 'Job not found or not open' };
        job.freelancer = sender;
        mockStorage.set(`job-${jobId}`, job);
        return { success: true };
      case 'accept-application':
        const [acceptJobId, freelancer] = args;
        const acceptJob = mockStorage.get(`job-${acceptJobId}`);
        if (!acceptJob || acceptJob.status !== 'OPEN' || acceptJob.client !== sender) {
          return { success: false, error: 'Not authorized or job not open' };
        }
        acceptJob.freelancer = freelancer;
        acceptJob.status = 'IN_PROGRESS';
        mockStorage.set(`job-${acceptJobId}`, acceptJob);
        return { success: true };
      case 'get-job':
        const [getJobId] = args;
        return { success: true, value: mockStorage.get(`job-${getJobId}`) };
      case 'complete-job':
        const [completeJobId] = args;
        const completeJob = mockStorage.get(`job-${completeJobId}`);
        if (!completeJob || completeJob.status !== 'IN_PROGRESS' || completeJob.freelancer !== sender) {
          return { success: false, error: 'Not authorized or job not in progress' };
        }
        completeJob.status = 'COMPLETED';
        mockStorage.set(`job-${completeJobId}`, completeJob);
        return { success: true };
      default:
        return { success: false, error: 'Method not found' };
    }
  };
  
  it('should post a job', () => {
    const result = mockContractCall('post-job', ['Test Job', 'Test Description', 1000], 'client1');
    expect(result.success).toBe(true);
    expect(result.value).toBe(1);
  });
  
  it('should apply for a job', () => {
    mockContractCall('post-job', ['Test Job', 'Test Description', 1000], 'client1');
    const result = mockContractCall('apply-for-job', [1], 'freelancer1');
    expect(result.success).toBe(true);
  });
  
  it('should accept an application', () => {
    mockContractCall('post-job', ['Test Job', 'Test Description', 1000], 'client1');
    mockContractCall('apply-for-job', [1], 'freelancer1');
    const result = mockContractCall('accept-application', [1, 'freelancer1'], 'client1');
    expect(result.success).toBe(true);
  });
  
  it('should get job information', () => {
    mockContractCall('post-job', ['Test Job', 'Test Description', 1000], 'client1');
    const result = mockContractCall('get-job', [1], 'anyone');
    expect(result.success).toBe(true);
    expect(result.value.title).toBe('Test Job');
  });
  
  it('should complete a job', () => {
    mockContractCall('post-job', ['Test Job', 'Test Description', 1000], 'client1');
    mockContractCall('apply-for-job', [1], 'freelancer1');
    mockContractCall('accept-application', [1, 'freelancer1'], 'client1');
    const result = mockContractCall('complete-job', [1], 'freelancer1');
    expect(result.success).toBe(true);
  });
});
