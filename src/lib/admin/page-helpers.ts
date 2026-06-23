import { adminCookieName, getAdminBySessionToken } from "@/lib/admin/auth";

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
