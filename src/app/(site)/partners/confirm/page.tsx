import type { Metadata } from "next";
import { PartnerConfirm } from "@/components/partners/PartnerConfirm";

export const metadata: Metadata = { title: "Confirm", robots: { index: false } };

export default function PartnerConfirmPage() {
  return (
    <div className="container-page max-w-xl pt-10 md:pt-16">
      <PartnerConfirm />
    </div>
  );
}
