"use server";

const API_BASE = process.env.API_URL || "http://localhost:4000";

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required" };

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Failed to request password reset" };
    }

    return { success: true, email };
  } catch {
    return { error: "Failed to connect to authentication server" };
  }
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
  const token = formData.get("token") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) return { error: "Missing or expired reset token" };
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Password reset failed" };
    }

    return { success: true };
  } catch {
    return { error: "Failed to connect to authentication server" };
  }
}
