"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { toast } from "sonner"
import { instamojoService } from "@/lib/instamojo"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  supplierId: string
  supplierName: string
  image?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  createOrder: (buyerDetails: any) => Promise<{ success: boolean; error?: string; orderId?: string }>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error)
        localStorage.removeItem('cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (newItem: CartItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id)
      
      if (existingItem) {
        return currentItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        )
      } else {
        return [...currentItems, newItem]
      }
    })
    
    toast.success(`${newItem.name} added to cart`)
  }

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id))
    toast.success("Item removed from cart")
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
    toast.success("Cart cleared")
  }

  const getTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  const createOrder = async (buyerDetails: any) => {
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    if (items.length === 0) {
      return { success: false, error: "Cart is empty" }
    }

    try {
      const token = localStorage.getItem('authToken')
      
      // Group items by supplier
      const supplierGroups = items.reduce((groups, item) => {
        if (!groups[item.supplierId]) {
          groups[item.supplierId] = []
        }
        groups[item.supplierId].push(item)
        return groups
      }, {} as Record<string, CartItem[]>)

      const orderIds: string[] = []

      // Create orders for each supplier
      for (const [supplierId, supplierItems] of Object.entries(supplierGroups)) {
        const totalOrderAmount = supplierItems.reduce((total, item) => total + (item.price * item.quantity), 0)
        const commission = instamojoService.calculateCommission(totalOrderAmount)

        const orderData = {
          supplierId,
          items: supplierItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
          totalAmount: totalOrderAmount,
          commission,
          shippingAddress: buyerDetails.address,
          deliveryCharges: 0, // You can calculate this based on location
        }

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create order')
        }

        const result = await response.json()
        orderIds.push(result.order._id)

        // Create payment request for this order
        const paymentRequest = await instamojoService.createPaymentRequest({
          amount: totalOrderAmount + instamojoService.calculateFees(totalOrderAmount),
          purpose: `Order #${result.order._id}`,
          buyer_name: buyerDetails.name,
          email: buyerDetails.email,
          phone: buyerDetails.phone,
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`,
          webhook: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/webhook`,
        })

        if (!paymentRequest.success) {
          throw new Error('Failed to create payment request')
        }

        // Create transaction record
        const transactionResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId: result.order._id,
            paymentRequestId: paymentRequest.payment_request_id,
            amount: totalOrderAmount + instamojoService.calculateFees(totalOrderAmount),
            fees: instamojoService.calculateFees(totalOrderAmount),
            commission,
            buyerName: buyerDetails.name,
            buyerEmail: buyerDetails.email,
            buyerPhone: buyerDetails.phone,
            instamojoResponse: paymentRequest,
          }),
        })

        if (!transactionResponse.ok) {
          console.error('Failed to create transaction record')
        }
      }

      // Clear cart after successful order creation
      clearCart()

      return { 
        success: true, 
        orderId: orderIds[0], // Return the first order ID for simplicity
        message: `Order created successfully with ${orderIds.length} order(s)` 
      }

    } catch (error: any) {
      console.error('Error creating order:', error)
      return { success: false, error: error.message || 'Failed to create order' }
    }
  }

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    createOrder,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
