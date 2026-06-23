import type { APIRoute } from "astro";
import { logAdminEvent } from "@/lib/admin/repository";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const url = new URL(request.url);
    const isHeartbeat = url.searchParams.get("heartbeat") === "true";
    const eventType = isHeartbeat ? "public_heartbeat" : "public_page_view";
    const message = isHeartbeat ? `Heartbeat ping from IP: ${ip}` : `Page viewed from IP: ${ip}`;

    await logAdminEvent(
      eventType,
      "public-web",
      message,
      "info",
      { ip, userAgent }
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0"
      },
    });
  } catch (error) {
    console.error("Failed to log page view:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET = POST;
