import { NextStudio } from "next-sanity/studio";
import { isSanityConfigured } from "@/sanity/env";
import config from "../../../../sanity.config";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <h1 className="text-4xl">Admin not connected yet</h1>
        <p className="mt-4 leading-relaxed">
          The product admin needs a free Sanity project. Follow the steps in <strong>ADMIN_GUIDE.md</strong> (about
          10 minutes), then add <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> in Vercel and redeploy.
        </p>
      </main>
    );
  }
  return <NextStudio config={config} />;
}
