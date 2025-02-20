import { describe, it, expect, beforeEach } from "vitest"

describe("Escrow Contract", () => {
  let mockStorage: Map<string, any>
  
  beforeEach(() => {
    mockStorage = new Map()
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "create-escrow":
        const [jobId, amount, freelancer] = args
        mockStorage.set(`escrow-${jobId}`, {
          amount,
          client: sender,
          freelancer,
          status: "LOCKED",
        })
        return { success: true }
      case "release-escrow":
        const [releaseJobId] = args
        const escrow = mockStorage.get(`escrow-${releaseJobId}`)
        if (!escrow || escrow.status !== "LOCKED" || escrow.client !== sender) {
          return { success: false, error: "Not authorized or escrow not locked" }
        }
        escrow.status = "RELEASED"
        mockStorage.set(`escrow-${releaseJobId}`, escrow)
        return { success: true }
      case "get-escrow":
        const [getEscrowJobId] = args
        return { success: true, value: mockStorage.get(`escrow-${getEscrowJobId}`) }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should create an escrow", () => {
    const result = mockContractCall("create-escrow", [1, 1000, "freelancer1"], "client1")
    expect(result.success).toBe(true)
  })
  
  it("should release an escrow", () => {
    mockContractCall("create-escrow", [1, 1000, "freelancer1"], "client1")
    const result = mockContractCall("release-escrow", [1], "client1")
    expect(result.success).toBe(true)
  })
  
  it("should get escrow information", () => {
    mockContractCall("create-escrow", [1, 1000, "freelancer1"], "client1")
    const result = mockContractCall("get-escrow", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.amount).toBe(1000)
  })
  
  it("should not release escrow if not the client", () => {
    mockContractCall("create-escrow", [1, 1000, "freelancer1"], "client1")
    const result = mockContractCall("release-escrow", [1], "freelancer1")
    expect(result.success).toBe(false)
  })
})

