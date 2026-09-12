import type { Metadata } from "next";
import { LoginView } from "../../../features/auth/login-view";

export const metadata: Metadata = {
  title: "Sign In - Meet Enterprise",
  description: "Sign in to your Meet account to host and join real-time encrypted video conferences.",
};

export default function LoginPage() {
  return <LoginView />;
}
