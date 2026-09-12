"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { error: (await res.text()) || "Login failed" };
    }

    if (!res.ok) {
      return { error: data.error || data.message || "Login failed" };
    }

    // Set secure HTTP-only cookies
    const cookieStore = await cookies();
    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60, // 15 mins
    });

    cookieStore.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: rememberMe ? 30 * 24 * 3600 : 24 * 3600,
    });
  } catch (err: any) {
    console.error("[AuthAction] Login error:", err);
    return { error: err?.message || "Network error occurred" };
  }

  redirect("/");
}

export async function signupAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { error: (await res.text()) || "Signup failed" };
    }

    if (!res.ok) {
      return { error: data.error || data.message || "Signup failed" };
    }
  } catch (err: any) {
    console.error("[AuthAction] Signup error:", err);
    return { error: err?.message || "Network error occurred" };
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {}

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  redirect("/login");
}
