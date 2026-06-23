import type { APIRoute } from "astro";
import type { RowDataPacket } from "mysql2/promise";
import { adminCookieName, getAdminBySessionToken } from "@/lib/admin/auth";
import { queryRows } from "@/lib/admin/db";
import {
  getMonitoringSummary,
  getDailyPublicViews,
} from "@/lib/admin/repository";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get(adminCookieName)?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const currentAdmin = await getAdminBySessionToken(sessionToken);
    if (!currentAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    interface CountRow extends RowDataPacket {
      total: number;
    }


    const [summary, dailyViewsRaw, cmsPageCounts, onlineUsersCount, recentViewsRaw] = await Promise.all([
      getMonitoringSummary(),
      getDailyPublicViews(14),
      queryRows<CountRow[]>("SELECT COUNT(*) AS total FROM cms_pages WHERE is_published = 1"),
      queryRows<CountRow[]>(
        `
          SELECT COUNT(DISTINCT payload_json->>'$.ip') AS total
          FROM monitoring_events
          WHERE event_type IN ('public_page_view', 'public_heartbeat')
            AND created_at >= UTC_TIMESTAMP() - INTERVAL 40 SECOND
        `
      ),
      queryRows<any[]>(
        `
          SELECT created_at, payload_json
          FROM monitoring_events
          WHERE event_type IN ('public_page_view', 'public_heartbeat')
            AND created_at >= UTC_TIMESTAMP() - INTERVAL 31 MINUTE
          ORDER BY created_at ASC
        `
      ),
    ]);

    const publishedCount = cmsPageCounts[0]?.total ?? 0;
    const draftCount = Math.max(summary.totalCmsPages - publishedCount, 0);
    const activeOnline = onlineUsersCount[0]?.total ?? 0;


    // Format Daily Views
    const viewsByDate = new Map(dailyViewsRaw.map((item) => [item.view_date, Number(item.total_views) || 0]));
    const dayWindow = 14;
    const filledDailyViews = Array.from({ length: dayWindow }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (dayWindow - 1 - index));
      const key = date.toISOString().slice(0, 10);

      const dayLabel = date.getUTCDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const monthLabel = monthNames[date.getUTCMonth()];

      return {
        view_date: key,
        label: `${dayLabel} ${monthLabel}`,
        total_views: viewsByDate.get(key) ?? 0,
      };
    });

    const totalViews14 = filledDailyViews.reduce((acc, item) => acc + item.total_views, 0);
    const todayViews = filledDailyViews[filledDailyViews.length - 1]?.total_views ?? 0;
    const averageViews = Number((totalViews14 / Math.max(filledDailyViews.length, 1)).toFixed(1));

    const compactDailyViews = filledDailyViews.slice(-7);
    const compactMaxViews = Math.max(...compactDailyViews.map((item) => item.total_views), 1);
    const totalViews7 = compactDailyViews.reduce((acc, item) => acc + item.total_views, 0);
    const topViewDay7 = [...compactDailyViews].sort((a, b) => b.total_views - a.total_views)[0] ?? {
      view_date: "-",
      total_views: 0,
    };
    const previousDayViews = compactDailyViews[compactDailyViews.length - 2]?.total_views ?? 0;
    const viewDeltaLabel =
      previousDayViews === 0
        ? todayViews > 0
          ? "+100%"
          : "0%"
        : `${Math.round(((todayViews - previousDayViews) / previousDayViews) * 100)}%`;

    // Serialize recent views and heartbeats to include payload_json
    const recentViews = recentViewsRaw.map((r) => {
      const dt = r.created_at instanceof Date ? r.created_at : new Date(r.created_at);
      return {
        created_at: dt.toISOString(),
        payload_json: r.payload_json
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        serverTime: Date.now(),
        activeOnline,
        summary: {
          ...summary,
          publishedCount,
          draftCount,
        },
        metrics: {
          todayViews,
          totalViews7,
          averageViews,
          topViewDay7: {
            total_views: topViewDay7.total_views,
            view_date: topViewDay7.view_date,
          },
          viewDeltaLabel,
        },
        dailyViews: filledDailyViews.slice(-7),
        compactMaxViews,
        recentViews,
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0"
        },
      }
    );
  } catch (error) {
    console.error("Failed to load live stats:", error);
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
