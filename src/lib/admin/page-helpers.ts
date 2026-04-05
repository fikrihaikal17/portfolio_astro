import { adminCookieName, getAdminBySessionToken } from "@/lib/admin/auth";

export const ensureAdminOrRedirect = async (
  Astro: any
): Promise<{ currentAdmin: Awaited<ReturnType<typeof getAdminBySessionToken>>; response: Response | null }> => {
  const sessionToken = Astro.cookies.get(adminCookieName)?.value;

  if (!sessionToken) {
    return {
      currentAdmin: null,
      response: Astro.redirect("/admin/login"),
    };
  }

  const currentAdmin = await getAdminBySessionToken(sessionToken);
  if (!currentAdmin) {
    Astro.cookies.delete(adminCookieName, { path: "/" });
    return {
      currentAdmin: null,
      response: Astro.redirect("/admin/login"),
    };
  }

  return { currentAdmin, response: null };
};
