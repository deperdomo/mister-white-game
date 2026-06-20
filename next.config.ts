import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { version as pkgVersion } from "./package.json";

// Versión derivada de git al construir: major.minor de package.json + nº de commits
// como patch (ej. v0.9.124). Se actualiza sola en cada push, sin tocar nada.
// ponytail: si no hay historial git (clon shallow), cae a la versión de package.json.
function appVersion(): string {
  const base = pkgVersion.split(".").slice(0, 2).join("."); // "0.9"
  try {
    const commits = execSync("git rev-list --count HEAD").toString().trim();
    return `${base}.${commits}`;
  } catch {
    return pkgVersion;
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion(),
  },
};

export default nextConfig;
