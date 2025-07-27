const INSTAMOJO_CONFIG = {
  privateApiKey: "12be9a96f3a0b8f5c441a53c27270486",
  privateAuthToken: "a5b2ac01aa42fb31c51646b1931f470b",
  privateSalt: "bd3918a0506e42bdb1d6c28ff238b3dc",
  baseUrl: "https://test.instamojo.com/api/1.1/",
}

export interface PaymentRequest {
  purpose: string
  amount: number
  buyer_name: string
  email: string
  phone: string
  redirect_url: string
  webhook: string
  allow_repeated_payments: boolean
}

export interface PaymentResponse {
  payment_request: {
    id: string
    longurl: string
    shorturl: string
    status: string
  }
  success: boolean
  message: string
}

export class InstamojoService {
  private headers = {
    "X-Api-Key": INSTAMOJO_CONFIG.privateApiKey,
    "X-Auth-Token": INSTAMOJO_CONFIG.privateAuthToken,
    "Content-Type": "application/x-www-form-urlencoded",
  }

  async createPaymentRequest(data: PaymentRequest): Promise<PaymentResponse> {
    try {
      const formData = new URLSearchParams()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })

      const response = await fetch(`${INSTAMOJO_CONFIG.baseUrl}payment-requests/`, {
        method: "POST",
        headers: this.headers,
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Payment request failed")
      }

      return result
    } catch (error) {
      console.error("Instamojo payment request failed:", error)
      throw new Error("Payment request failed")
    }
  }

  async getPaymentStatus(paymentRequestId: string, paymentId: string) {
    try {
      const response = await fetch(`${INSTAMOJO_CONFIG.baseUrl}payment-requests/${paymentRequestId}/${paymentId}/`, {
        method: "GET",
        headers: this.headers,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to get payment status")
      }

      return result
    } catch (error) {
      console.error("Failed to get payment status:", error)
      throw new Error("Failed to get payment status")
    }
  }

  async processRefund(paymentId: string, amount: number, reason: string) {
    try {
      const formData = new URLSearchParams()
      formData.append("payment_id", paymentId)
      formData.append("type", "RFD")
      formData.append("body", reason)
      formData.append("refund_amount", amount.toString())

      const response = await fetch(`${INSTAMOJO_CONFIG.baseUrl}refunds/`, {
        method: "POST",
        headers: this.headers,
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Refund processing failed")
      }

      return result
    } catch (error) {
      console.error("Refund processing failed:", error)
      throw new Error("Refund processing failed")
    }
  }

  calculateCommission(amount: number): number {
    return Math.round(amount * 0.025 * 100) / 100 // 2.5% commission
  }
}

export const instamojo = new InstamojoService()
