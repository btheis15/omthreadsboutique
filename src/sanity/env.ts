export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2025-01-01";

/** True once the owner has connected a Sanity project. */
export const isSanityConfigured = Boolean(projectId);
