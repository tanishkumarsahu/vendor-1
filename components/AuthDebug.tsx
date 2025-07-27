"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthDebug() {
  const { user, loading, signOut } = useAuth()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Status:</h3>
          <p className="text-sm">
            {loading ? "Loading..." : user ? "Authenticated" : "Not authenticated"}
          </p>
        </div>

        {user && (
          <div>
            <h3 className="font-semibold mb-2">User Info:</h3>
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Email Verified:</strong> {user.emailVerified ? "Yes" : "No"}</p>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button 
            onClick={signOut} 
            variant="outline" 
            className="w-full"
            disabled={!user}
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 