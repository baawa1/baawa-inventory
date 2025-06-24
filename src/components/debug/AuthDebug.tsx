import { useSession } from "next-auth/react";

export function AuthDebug() {
  const { data: session, status } = useSession();

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mb-4">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <div className="text-sm space-y-1">
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Has Session:</strong> {session ? "Yes" : "No"}
        </p>
        {session && (
          <>
            <p>
              <strong>User ID:</strong> {session.user?.id}
            </p>
            <p>
              <strong>Email:</strong> {session.user?.email}
            </p>
            <p>
              <strong>Role:</strong> {session.user?.role}
            </p>
            <p>
              <strong>Status:</strong> {session.user?.status}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
