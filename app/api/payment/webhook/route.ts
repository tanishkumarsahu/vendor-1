import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify the webhook signature (implement based on Instamojo docs)
    const paymentId = body.payment_id
    const paymentRequestId = body.payment_request_id
    const status = body.status

    if (status === "Credit") {
      // Payment successful
      const { data: orders, error } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("payment_id", paymentRequestId)
        .select()

      if (error) {
        console.error("Error updating orders:", error)
        return NextResponse.json({ error: "Failed to update orders" }, { status: 500 })
      }

      // Update transaction status
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          gateway_response: body,
        })
        .eq("payment_id", paymentRequestId)

      // Send notifications to vendors and suppliers
      for (const order of orders || []) {
        // Notify vendor
        await supabase.from("notifications").insert({
          user_id: order.vendor_id,
          type: "order",
          title: "Payment Confirmed",
          message: `Your payment for order #${order.id.slice(-8)} has been confirmed. Your order is being processed.`,
        })

        // Notify supplier
        await supabase.from("notifications").insert({
          user_id: order.supplier_id,
          type: "order",
          title: "New Order Received",
          message: `You have received a new order #${order.id.slice(-8)}. Please confirm and process the order.`,
        })
      }
    } else {
      // Payment failed
      await supabase.from("orders").update({ status: "cancelled" }).eq("payment_id", paymentRequestId)

      await supabase
        .from("transactions")
        .update({
          status: "failed",
          gateway_response: body,
        })
        .eq("payment_id", paymentRequestId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
