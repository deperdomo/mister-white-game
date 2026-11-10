import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    // Las pantallas de partida y prueba no aportan nada en los buscadores
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/room/", "/waiting-room", "/local-game", "/game", "/demo"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
