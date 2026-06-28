import type { APIRoute } from "astro";
import { adminCookieName, getAdminBySessionToken, verifyAdminCredentials } from "@/lib/admin/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const sessionToken = cookies.get(adminCookieName)?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ success: false, error: "Sesi tidak valid atau telah berakhir." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const currentAdmin = await getAdminBySessionToken(sessionToken);
    if (!currentAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Akses ditolak." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(JSON.stringify({ success: false, error: "Password wajib diisi." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const verified = await verifyAdminCredentials(currentAdmin.username, password);
    if (!verified) {
      return new Response(JSON.stringify({ success: false, error: "Password superadmin salah." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Set sudo cookie
    cookies.set("superadmin_sudo_active", "true", {
      path: "/",
      maxAge: 30 * 60, // 30 minutes
      httpOnly: true, // Prevent client-side scripting access/spoofing
      secure: true,
      sameSite: "strict",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
