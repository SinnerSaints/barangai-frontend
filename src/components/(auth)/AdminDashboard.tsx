"use client"

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";

type PendingUser = {
  id: number;
  email: string;
  password?: string;
  role?: string;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<PendingUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending users from a backend endpoint. If your backend route differs,
  // update the URL below. The UI will fall back to sample data on failure.
  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the backend user list endpoint as requested
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/accounts/users/`);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      // Expecting an array of users. Map into the PendingUser shape conservatively.
      if (Array.isArray(data)) {
        const mapped = data.map((u: any, idx: number) => ({
          id: u.id ?? idx + 1,
          email: u.email ?? u.user ?? "",
          password: (u.password as string) ?? (u.raw_password as string) ?? undefined,
          role: u.role ?? undefined,
        } as PendingUser));
        setUsers(mapped);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      // fallback sample data so admin can still use UI while backend is absent
      setError("Unable to load pending users from server — using sample data.");
      setUsers([
        { id: 1, email: "user1@example.com", password: "pass123", role: "CAPTAIN" },
        { id: 2, email: "user2@example.com", password: "hunter2", role: "OFFICIALS" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    // optimistic UI: remove immediately
    setUsers((prev) => prev ? prev.filter((u) => u.id !== id) : prev);
    try {
      const res = await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err: any) {
      // revert optimistic removal on error and show a message
      setError(`Unable to ${action} user: ${err?.message || err}`);
      // refetch to restore state
      fetchPending();
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-6">Approve or reject newly registered users. The table shows their email, password (as submitted) and role.</p>

      {loading && <div className="mb-4">Loading pending users...</div>}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.password ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.role ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleAction(u.id, "approve")} className="mr-2 inline-flex items-center px-3 py-1 rounded bg-accentGreen text-black">Approve</button>
                    <button onClick={() => handleAction(u.id, "reject")} className="inline-flex items-center px-3 py-1 rounded bg-red-600 text-white">Reject</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">No pending users</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}