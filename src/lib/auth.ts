type LoginResponse = {
  access?: string;
  refresh?: string;
  role?: string;
  [k: string]: any;
  first_name: string;
  last_name: string;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
export const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

function getAvatarValue(data: any): string | undefined {
  return (
    data?.avatar ||
    data?.avatar_url ||
    data?.photo ||
    data?.picture ||
    undefined
  );
}

/**
 * Login helper: Fetches JWT tokens and user profile info.
 */
export async function login(
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  role?: string,
  options?: { returnRaw?: boolean; includeCredentials?: boolean }
): Promise<LoginResponse | { success: boolean; data?: any; error?: any }> {
  const login_url = `${API_BASE_URL}accounts/login/`;
  const token_url = `${API_BASE_URL}accounts/token/`;

  try {
    // 1. Get JWT Tokens
    const token_res = await fetch(token_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, first_name, last_name }),
    });

    if (!token_res.ok) {
      const errorData = await token_res.json();
      throw new Error(errorData.detail || "Invalid credentials");
    }

    const token_data = await token_res.json();

    // 2. Get User Profile/Role Info
    const login_res = await fetch(login_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const user_data = await login_res.json();

    if (!login_res.ok) throw new Error(user_data.detail || "No profile registered with that credential.");

    // 3. Persist everything to localStorage
    localStorage.setItem("access_token", token_data.access);
    localStorage.setItem("refresh_token", token_data.refresh);
    localStorage.setItem("user_id", user_data.id.toString());
    localStorage.setItem("user_email", user_data.email || user_data.user);
    localStorage.setItem("user_role", user_data.role);
    localStorage.setItem("first_name", user_data.first_name);
    localStorage.setItem("last_name", user_data.last_name);
    if (user_data.avatar) localStorage.setItem("user_avatar", user_data.avatar);

    if (options?.returnRaw) return { success: true, data: { ...token_data, ...user_data } };
    return { ...token_data, ...user_data } as LoginResponse;

  } catch (err: any) {
    if (options?.returnRaw) return { success: false, error: err.message };
    throw err;
  }
}

export async function signup(email: string, password: string, first_name: string, last_name: string, role?: string) {
  const url = `${API_BASE_URL}accounts/register/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role, first_name, last_name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Signup failed");
  return data;
}

export function logout() {
  localStorage.clear(); // Clears all auth data at once
}

/**
 * Update profile: Supports Email, Password, and Avatar File.
 */
export async function updateProfile(opts: {
  email?: string;
  password?: string;
  avatarFile?: File | null;
  first_name?: string;
  last_name?: string;
}) {
  const user_id = localStorage.getItem("user_id");
  const access = localStorage.getItem("access_token");
  const url = `${API_BASE_URL}accounts/users/${user_id}/update/`;

  const fd = new FormData();
  if (opts.email) fd.append("email", opts.email);
  if (opts.password) fd.append("password", opts.password);
  if (opts.avatarFile) fd.append("avatar", opts.avatarFile);
  if (opts.first_name) fd.append("first_name", opts.first_name);
  if (opts.last_name) fd.append('last_name', opts.last_name);

  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${access}` },
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Update failed");

  // Sync updated info
  if (data.email) localStorage.setItem("user_email", data.email);
  const avatar = getAvatarValue(data);
  if (avatar) localStorage.setItem("user_avatar", avatar);
  if (data.first_name) localStorage.setItem("first_name", data.first_name);
  if (data.last_name) localStorage.setItem("last_name", data.last_name);

  return data;
}
