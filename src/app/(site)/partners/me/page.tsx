import type { Metadata } from "next";
import { PartnerPage } from "@/components/partners/PartnerPage";

export const metadata: Metadata = { title: "Your seller page", robots: { index: false } };

export default function PartnerMePage() {
  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <PartnerPage />
    </div>
  );
}
