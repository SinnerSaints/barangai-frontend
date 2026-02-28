"use client"

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/auth";

type UserItem = {
  id: number;
  email: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  is_approved?: boolean;
  [k: string]: any;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserItem[] | null>(null);
  const [pendingUsers, setPendingUsers] = useState<UserItem[] | null>(null);
  const [approvedUsers, setApprovedUsers] = useState<UserItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending users from a backend endpoint. If your backend route differs,
  // update the URL below. The UI will fall back to sample data on failure.
  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the backend user list endpoint as requested. Include auth token if present.
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/accounts/users/`, { headers });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      // Expecting an array of users. Map into the PendingUser shape conservatively.
      if (Array.isArray(data)) {
        const mapped: UserItem[] = data.map((u: any, idx: number) => ({
          id: u.id ?? idx + 1,
          email: u.email ?? u.user ?? "",
          password: (u.password as string) ?? (u.raw_password as string) ?? undefined,
          role: u.role ?? undefined,
          is_active: u.is_active ?? u.isActive ?? undefined,
          is_approved: u.is_approved ?? u.isApproved ?? undefined,
          // keep raw for debugging
          ...u,
        }));

        setUsers(mapped);
        // categorize
        const approved = mapped.filter((x) => {
          if (typeof x.is_active === "boolean") return x.is_active === true;
          if (typeof x.is_approved === "boolean") return x.is_approved === true;
          return false;
        });
        const pending = mapped.filter((x) => !approved.includes(x));
        setApprovedUsers(approved);
        setPendingUsers(pending);
      } else {
        setUsers([]);
        setApprovedUsers([]);
        setPendingUsers([]);
      }
    } catch (err: any) {
      // fallback sample data so admin can still use UI while backend is absent
      setError("Unable to load pending users from server — using sample data.");
      const sample = [
        { id: 1, email: "user1@example.com", password: "pass123", role: "CAPTAIN", is_active: false },
        { id: 2, email: "user2@example.com", password: "hunter2", role: "OFFICIALS", is_active: false },
        { id: 3, email: "approved@example.com", password: undefined, role: "CAPTAIN", is_active: true },
      ];
      setUsers(sample as any);
      setPendingUsers(sample.filter((s) => !s.is_active));
      setApprovedUsers(sample.filter((s) => s.is_active));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setError(null);
    setLoading(true);
    try {
      // call the backend user endpoints directly: users/<pk>/approve/ or users/<pk>/delete/
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const endpointAction = action === "approve" ? "approve" : "delete";
      const url = `${API_BASE_URL.replace(/\/$/, "")}/accounts/users/${id}/${endpointAction}/`;

      // Some backends expect an empty POST body; others accept JSON. We'll send no body
      // and rely on the URL+method. If your backend expects JSON, we can send { id } instead.
      const res = await fetch(url, {
        method: "POST",
        headers,
      });

      // Helpful logging for debugging
      // eslint-disable-next-line no-console
      console.log(`Admin action ${action} ${id} ->`, res.status);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status} ${text}`);
      }

      // success: refresh the list from server to reflect actual state
      await fetchPending();
    } catch (err: any) {
      setError(`Unable to ${action} user: ${err?.message || err}`);
      // keep users as-is (no optimistic removal) and ensure list synced
      await fetchPending();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-6">Approve or reject newly registered users. The table shows their email, password (as submitted) and role.</p>

      {loading && <div className="mb-4">Loading users...</div>}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Pending Users</h2>
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
                {pendingUsers && pendingUsers.length > 0 ? (
                  pendingUsers.map((u) => (
                    <tr key={`p-${u.id}`} className="border-t">
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
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Approved Users</h2>
          <div className="overflow-x-auto shadow rounded-lg">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers && approvedUsers.length > 0 ? (
                  approvedUsers.map((u) => (
                    <tr key={`a-${u.id}`} className="border-t">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.role ?? "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleAction(u.id, "reject")} className="inline-flex items-center px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">No approved users</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}