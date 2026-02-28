type LoginResponse = {
  access?: string;
  refresh?: string;
  role?: string;
  [k: string]: any;
};

const API_BASE_URL = "https://barangaibackend-production.up.railway.app";

/**
 * Login helper.
 * By default throws on error and returns parsed response on success.
 * If `options.returnRaw === true` it will return `{ success, data, error }` instead
 * of throwing so callers can handle the result object.
 */
export async function login(
  email: string,
  password: string,
  role: string,
  options?: { returnRaw?: boolean; includeCredentials?: boolean }
): Promise<LoginResponse | { success: boolean; data?: any; error?: any }> {
  const url = `${API_BASE_URL}/accounts/login/`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role}),
      // allow callers to opt into sending cookies if they change server to cookie-based
      credentials: options?.includeCredentials ? "include" : (undefined as any),
    });
  } catch (err) {
    // Normalize common browser network error messages into a clearer message
    const rawMsg = (err as Error).message || "Network error";
    const isNetworkErr = [
      "Failed to fetch",
      "NetworkError when attempting to fetch resource.",
      "Load failed",
      "Network error",
      "request to .* failed",
    ].some((m) => {
      try {
        const re = new RegExp(m);
        return re.test(rawMsg);
      } catch {
        return rawMsg === m;
      }
    });

    const message = isNetworkErr ? "Unable to reach authentication server" : rawMsg;
    if (options?.returnRaw) return { success: false, error: message };
    throw new Error(message);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.detail || data?.error || JSON.stringify(data) || "Login failed";
    if (options?.returnRaw) return { success: false, error: message };
    throw new Error(message);
  }

  // persist tokens / info for convenience (adjust keys as you prefer)
  if (data.access) localStorage.setItem("access_token", data.access);
  if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
  if (data.role) localStorage.setItem("user_role", data.role);
  if (data.user) localStorage.setItem("user_email", data.user);
  if (data.email) localStorage.setItem("user_email", data.email);

  if (options?.returnRaw) return { success: true, data };
  return data as LoginResponse;
}

export async function signup(email: string, password: string) {
  const url = `${API_BASE_URL}/accounts/register/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || "Signup failed");
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_email");
}
