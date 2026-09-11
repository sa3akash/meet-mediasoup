"use client";

import { ChangePasswordCard } from "./change-password-card";
import { PasskeysCard } from "./passkeys-card";
import { SessionsCard } from "./sessions-card";

export function SecurityCardsContainer() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  return (
    <>
      <ChangePasswordCard apiBase={apiBase} getAuthHeaders={getAuthHeaders} />
      <PasskeysCard apiBase={apiBase} getAuthHeaders={getAuthHeaders} />
      <SessionsCard apiBase={apiBase} getAuthHeaders={getAuthHeaders} />
    </>
  );
}
