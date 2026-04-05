import type { APIRoute } from "astro";
import { adminCookieName, revokeAdminSession } from "@/lib/admin/auth";
import { logAdminEvent } from "@/lib/admin/repository";

export const prerender = false;

const handleLogout: APIRoute = async ({ cookies, redirect }) => {
  const token = cookies.get(adminCookieName)?.value;

  if (token) {
    await revokeAdminSession(token);
    await logAdminEvent("admin_logout", "admin-logout", "Superadmin logout", "info");
  }

  cookies.delete(adminCookieName, { path: "/" });
  return redirect("/admin/login");
};

export const GET = handleLogout;
export const POST = handleLogout;
