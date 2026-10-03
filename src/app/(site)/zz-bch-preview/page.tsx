import { BchPay } from "../checkout/success/BchPay";
export default function P() {
  const addr = "bitcoincash:qrq0l3x9fh7a6mm9cwl4k5hj2dvlp4tz7xs8e9mv3c";
  return (
    <div className="container-page max-w-2xl pt-10 pb-20">
      <BchPay token="preview-token-123" test={false} initial={{ state: "waiting", address: addr, amountBch: "0.13896", totalBch: "0.13896", paidBch: null, uri: `${addr}?amount=0.13896`, usdCents: 5558, expiresAt: new Date(Date.now() + 14 * 60e3).toISOString(), minutes: 15, canRenew: true, txUrl: null, coupon: null, applied: { label: "Om Threads (3 OMT)", discountCents: 1200, bch: "0.03" },
        breakdown: { usdPerBch: 400, sources: ["Coinbase", "Kraken", "Bitstamp"], lines: [
          { kind: "items", label: "2 pieces", bch: "0.15", cents: 6000 },
          { kind: "tokens", label: "Om Threads", tokens: "3 OMT", each: "0.01 BCH", bch: "0.03", cents: 1200 },
          { kind: "shipping", label: "USPS Ground Advantage", bch: "0.015", cents: 600 },
          { kind: "tax", label: "Sales tax", bch: "0.00396", cents: 158 } ], total: { bch: "0.13896", cents: 5558 } } }} />
    </div>
  );
}
