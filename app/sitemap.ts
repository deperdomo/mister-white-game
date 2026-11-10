import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/local", "/create-room", "/join-room"].map((path) => ({ url: `${SITE_URL}${path}` }));
}
