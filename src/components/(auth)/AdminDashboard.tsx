"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, logout as apiLogout } from "@/lib/auth";

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
  const router = useRouter();

  // derive logged-in user from localStorage for display
  const currentEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
  const currentRole = typeof window !== "undefined" ? localStorage.getItem("user_role") : null;
  const currentAvatar = typeof window !== "undefined" ? localStorage.getItem("user_avatar") : null;

  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  // initialize as empty arrays so counts render immediately (avoid showing "—")
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserItem[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuery, setPendingQuery] = useState("");
  const [approvedQuery, setApprovedQuery] = useState("");

  // Fetch pending users from a backend endpoint. If your backend route differs,
  // update the URL below. The UI will fall back to sample data on failure.
  const getAccessToken = async () => { // Para ni ug mo refresh ang user sa page di mawala ang token.
    let token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!token && refreshToken) {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/accounts/token/`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({refresh: refreshToken}),
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("access_token", data.access);
          return data.access;
        }
      } catch (err) {
        console.error("Token refresh failed", err)
      }
    }
    return token;
  };

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the backend user list endpoint as requested. Include auth token if present.
      const token = await getAccessToken();
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
  setLastRefreshed(new Date().toLocaleString());
      } else {
    setUsers([]);
    setApprovedUsers([]);
    setPendingUsers([]);
    setLastRefreshed(new Date().toLocaleString());
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
  setLastRefreshed(new Date().toLocaleString());
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
        method: "ALLOWED_METHODS" in Response.prototype ? "ALLOW_METHODS" : action === "approve" ? "PATCH" : "DELETE",
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">Manage users, approvals and accounts</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Signed in as</div>
            <div className="flex items-center gap-2">
              <img src={currentAvatar || (currentEmail ? `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmail)}&background=9DE16A&color=034440&rounded=true&size=32` : "/favicon.ico")} alt="avatar" className="w-8 h-8 rounded-full" />
              <div className="text-sm">
                <div className="font-medium">{currentEmail ?? "—"}</div>
                <div className="text-xs text-gray-500">{currentRole ?? "Admin"}</div>
              </div>
            </div>
          </div>
          <button onClick={() => { apiLogout(); router.push('/auth'); }} className="px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm">Logout</button>
        </div>
      </div>

      {loading && <div className="mb-4">Loading users...</div>}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">{(users?.length ?? (pendingUsers.length + approvedUsers.length))}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingUsers ? pendingUsers.length : "—"}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Approved</div>
            <div className="text-2xl font-bold text-green-600">{approvedUsers ? approvedUsers.length : "—"}</div>
          </div>
          <div className="text-xs text-gray-500">{lastRefreshed ?? "Not refreshed yet"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Pending Users</h2>
            <div className="text-sm text-gray-500">{pendingUsers ? pendingUsers.length : 0} pending</div>
          </div>
          <div className="mb-3 flex gap-2">
            <input value={pendingQuery} onChange={(e) => setPendingQuery(e.target.value)} placeholder="Search pending users" className="flex-1 p-2 border rounded-md text-sm" />
            <button onClick={() => fetchPending()} className="px-3 py-2 bg-gray-100 rounded-md text-sm">Refresh</button>
          </div>
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
                {pendingUsers && pendingUsers.length > 0 ? (
                  pendingUsers
                    .filter((u) => {
                      const q = pendingQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
                    })
                    .map((u, idx) => (
                      <tr key={`p-${u.id}`} className={`border-t odd:bg-gray-50 hover:bg-gray-100 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${u.role === 'CAPTAIN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{u.role ?? "—"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleAction(u.id, "approve")} className="mr-2 inline-flex items-center gap-2 px-3 py-1 rounded bg-accentGreen text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Approve
                          </button>
                          <button onClick={() => handleAction(u.id, "reject")} className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-600 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h2v8H3a1 1 0 100 2h2v1a1 1 0 102 0v-1h6v1a1 1 0 102 0v-1h2a1 1 0 100-2h-2V6h2a1 1 0 100-2h-2V3a1 1 0 00-1-1H6z" clipRule="evenodd" /></svg>
                            Reject
                          </button>
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
                  approvedUsers
                    .filter((u) => {
                      const q = approvedQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q);
                    })
                    .map((u) => (
                      <tr key={`a-${u.id}`} className={`border-t odd:bg-gray-50 hover:bg-gray-100 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"><span className={`px-2 py-0.5 text-xs rounded-full ${u.role === 'CAPTAIN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{u.role ?? "—"}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleAction(u.id, "reject")} className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-600 text-white">Delete</button>
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