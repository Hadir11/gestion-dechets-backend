const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

export const API_BASE_URL = (configuredApiBase || "http://localhost:18081/api").replace(
  /\/+$/,
  "",
);

export const API_BASE_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");
