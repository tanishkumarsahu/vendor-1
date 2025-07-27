"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download, Package, Truck } from "lucide-react"
import { toast } from "sonner"

interface OrderDetails {
  _id: string
  totalAmount: number
  status: string
  paymentStatus: string
  items: Array<{
    productId: {
      name: string
      price: number
    }
    quantity: number
    total: number
  }>
  vendor: {
    businessName: string
  }
  supplier: {
    businessName: string
  }
  createdAt: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const paymentRequestId = searchParams.get("payment_request_id")
    const orderId = searchParams.get("order_id")

    if (paymentRequestId || orderId) {
      fetchOrderDetails(paymentRequestId, orderId)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const fetchOrderDetails = async (paymentRequestId: string | null, orderId: string | null) => {
    try {
      const token = localStorage.getItem('authToken')
      const params = new URLSearchParams()
      
      if (paymentRequestId) params.append('payment_request_id', paymentRequestId)
      if (orderId) params.append('order_id', orderId)

      const response = await fetch(`/api/payment/status?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOrderDetails(data.order)
      } else {
        toast.error("Failed to fetch order details")
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
      toast.error("Error fetching order details")
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = () => {
    // Generate and download invoice
    toast.info("Invoice download feature coming soon!")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Order Not Found</CardTitle>
            <CardDescription>
              Unable to find the order details. Please check your order ID or contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your order has been confirmed and payment has been processed successfully.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  Order #{orderDetails._id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <p className="font-medium">{item.productId.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₹{item.total}</p>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-xl font-bold text-green-600">₹{orderDetails.totalAmount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium">{orderDetails._id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">
                    {new Date(orderDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={orderDetails.status === 'confirmed' ? 'default' : 'secondary'}>
                    {orderDetails.status}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <Badge variant={orderDetails.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {orderDetails.paymentStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Vendor</p>
                  <p className="font-medium">{orderDetails.vendor.businessName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Supplier</p>
                  <p className="font-medium">{orderDetails.supplier.businessName}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Order Processing</p>
                    <p className="text-sm text-gray-600">
                      Your order is being processed and will be shipped soon.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Tracking</p>
                    <p className="text-sm text-gray-600">
                      You'll receive tracking information once your order ships.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={downloadInvoice} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
