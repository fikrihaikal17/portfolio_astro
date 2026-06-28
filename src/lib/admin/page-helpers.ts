import { adminCookieName, getAdminBySessionToken, verifyAdminCredentials } from "@/lib/admin/auth";

export const ensureAdminOrRedirect = async (
  Astro: any
): Promise<{ currentAdmin: Awaited<ReturnType<typeof getAdminBySessionToken>>; response: Response | null }> => {
  const sessionToken = Astro.cookies.get(adminCookieName)?.value;

  if (!sessionToken) {
    return {
      currentAdmin: null,
      response: Astro.redirect(import.meta.env.BASE_URL + "kall-control-panel/login"),
    };
  }

  const currentAdmin = await getAdminBySessionToken(sessionToken);
  if (!currentAdmin) {
    Astro.cookies.delete(adminCookieName, { path: "/" });
    return {
      currentAdmin: null,
      response: Astro.redirect(import.meta.env.BASE_URL + "kall-control-panel/login"),
    };
  }

  return { currentAdmin, response: null };
};

export const handleSudoVerification = async (
  Astro: any,
  adminUsername: string,
  formData: FormData
): Promise<void> => {
  const isSudoActive = Astro.cookies.get("superadmin_sudo_active")?.value === "true";
  if (!isSudoActive) {
    const sudoPassword = formData.get("sudo_password") ? String(formData.get("sudo_password")) : null;
    if (!sudoPassword) {
      throw new Error("Verifikasi keamanan diperlukan. Silakan masukkan password.");
    }
    const verified = await verifyAdminCredentials(adminUsername, sudoPassword);
    if (!verified) {
      throw new Error("Password verifikasi superadmin salah.");
    }
    Astro.cookies.set("superadmin_sudo_active", "true", {
      path: "/",
      maxAge: 30 * 60, // 30 minutes
      httpOnly: true, // Prevent client-side scripting access/spoofing
      secure: true,
      sameSite: "strict",
    });
  }
};
