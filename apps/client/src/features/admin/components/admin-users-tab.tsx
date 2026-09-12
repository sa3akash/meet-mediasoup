import React from "react";
import { Search, Ban, Trash2 } from "lucide-react";

interface AdminUsersTabProps {
  usersList: any[];
  userSearch: string;
  setUserSearch: (v: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (v: string) => void;
  onFilter: () => void;
  onRoleChange: (userId: string, role: any) => void;
  onBanToggle: (userId: string, isBanned: boolean) => void;
  onDeleteUser: (userId: string) => void;
}

export function AdminUsersTab({
  usersList,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  onFilter,
  onRoleChange,
  onBanToggle,
  onDeleteUser,
}: AdminUsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-neutral-900 border border-white/5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onFilter()}
            placeholder="Search user name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-800 border border-white/5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={userRoleFilter}
          onChange={(e) => {
            setUserRoleFilter(e.target.value);
            setTimeout(onFilter, 50);
          }}
          className="px-3 py-2 rounded-xl bg-neutral-800 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="USER">User</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>

        <button
          onClick={onFilter}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
        >
          Filter
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="bg-neutral-800/60 text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Joined</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {usersList.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  No users found
                </td>
              </tr>
            ) : (
              usersList.map((u) => {
                const isBanned = Boolean(u.bannedAt);
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center font-semibold text-white">
                        {u.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-neutral-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => onRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-neutral-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="USER">USER</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      {isBanned ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold border border-red-500/30">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onBanToggle(u.id, isBanned)}
                          className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                            isBanned
                              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          }`}
                          title={isBanned ? "Unban account" : "Ban account & revoke sessions"}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{isBanned ? "Unban" : "Ban"}</span>
                        </button>
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
