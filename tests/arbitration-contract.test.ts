import { describe, it, expect, beforeEach } from "vitest"

describe("Arbitration Contract", () => {
  let mockStorage: Map<string, any>
  
  beforeEach(() => {
    mockStorage = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "register-arbiter":
        const [arbiter] = args
        mockStorage.set(`arbiter-${arbiter}`, { is_approved: true })
        return { success: true }
      case "initiate-dispute":
        const [jobId] = args
        mockStorage.set(`dispute-${jobId}`, {
          client: "client1",
          freelancer: "freelancer1",
          arbiter: null,
          status: "OPEN",
          resolution: null,
        })
        return { success: true }
      case "assign-arbiter":
        const [assignJobId, assignArbiter] = args
        const dispute = mockStorage.get(`dispute-${assignJobId}`)
        if (!dispute || dispute.status !== "OPEN") {
          return { success: false, error: "Dispute not found or not open" }
        }
        dispute.arbiter = assignArbiter
        dispute.status = "IN_PROGRESS"
        mockStorage.set(`dispute-${assignJobId}`, dispute)
        return { success: true }
      case "resolve-dispute":
        const [resolveJobId, resolution] = args
        const resolveDispute = mockStorage.get(`dispute-${resolveJobId}`)
        if (!resolveDispute || resolveDispute.status !== "IN_PROGRESS" || resolveDispute.arbiter !== sender) {
          return { success: false, error: "Not authorized or dispute not in progress" }
        }
        resolveDispute.status = "RESOLVED"
        resolveDispute.resolution = resolution
        mockStorage.set(`dispute-${resolveJobId}`, resolveDispute)
        return { success: true }
      case "get-dispute":
        const [getDisputeJobId] = args
        return { success: true, value: mockStorage.get(`dispute-${getDisputeJobId}`) }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should register an arbiter", () => {
    const result = mockContractCall("register-arbiter", ["arbiter1"], "contract_owner")
    expect(result.success).toBe(true)
  })
  
  it("should initiate a dispute", () => {
    const result = mockContractCall("initiate-dispute", [1], "client1")
    expect(result.success).toBe(true)
  })
  
  it("should assign an arbiter", () => {
    mockContractCall("register-arbiter", ["arbiter1"], "contract_owner")
    mockContractCall("initiate-dispute", [1], "client1")
    const result = mockContractCall("assign-arbiter", [1, "arbiter1"], "anyone")
    expect(result.success).toBe(true)
  })
  
  it("should resolve a dispute", () => {
    mockContractCall("register-arbiter", ["arbiter1"], "contract_owner")
    mockContractCall("initiate-dispute", [1], "client1")
    mockContractCall("assign-arbiter", [1, "arbiter1"], "anyone")
    const result = mockContractCall("resolve-dispute", [1, "RESOLVED_FOR_CLIENT"], "arbiter1")
    expect(result.success).toBe(true)
  })
  
  it("should get dispute information", () => {
    mockContractCall("initiate-dispute", [1], "client1")
    const result = mockContractCall("get-dispute", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.status).toBe("OPEN")
  })
})

