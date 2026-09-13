import Link from "next/link";
import { Video, LayoutDashboard, LogOut } from "lucide-react";
import { logoutAction } from "../../actions/auth.actions";

interface HomeHeaderProps {
  user: any;
}

export function HomeHeader({ user }: HomeHeaderProps) {
  return (
    <header className="w-full px-6 sm:px-8 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-neutral-950/70 sticky top-0 z-20">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Video className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
          Meet
        </span>
      </Link>

      {user ? (
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/meetings"
            className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.slice(0, 2)
              )}
            </div>
            <div className="hidden md:flex flex-col text-left pr-1">
              <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
              <span className="text-[10px] text-neutral-400 leading-tight">{user.email}</span>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className="p-2 rounded-full bg-neutral-900 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-neutral-400 text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/login"
            className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white text-xs transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/30"
          >
            Get Started
          </Link>
        </nav>
      )}
    </header>
  );
}
