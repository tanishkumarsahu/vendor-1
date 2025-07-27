"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function PaymentSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const paymentId = searchParams.get("payment_id")
    const paymentRequestId = searchParams.get("payment_request_id")

    if (paymentId && paymentRequestId) {
      loadOrderDetails(paymentRequestId)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const loadOrderDetails = async (paymentRequestId: string) => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          ),
          supplier:supplier_profiles!orders_supplier_id_fkey(*)
        `)
        .eq("payment_id", paymentRequestId)

      if (error) throw error

      setOrderDetails(orders)
    } catch (error) {
      console.error("Error loading order details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">Payment Successful!</CardTitle>
            <p className="text-gray-600 mt-2">Your order has been confirmed and is being processed by the suppliers.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderDetails && orderDetails.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                {orderDetails.map((order: any) => (
                  <div key={order.id} className="p-4 bg-gray-50 rounded-lg text-left">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">{order.supplier?.company_name}</p>
                      </div>
                      <p className="font-bold">₹{order.total.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} items • Expected delivery in 1-2 days
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push("/dashboard")} className="vm-btn-primary">
                <Package className="mr-2 h-4 w-4" />
                View Orders
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard?tab=marketplace")}
                className="bg-transparent"
              >
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <p>You will receive order updates via notifications.</p>
              <p>For any issues, contact our support team.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
