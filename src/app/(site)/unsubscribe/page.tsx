import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ t?: string; r?: string }> };

/** Landing page for the reminder email's unsubscribe link. A button (not the visit itself) turns it off; works without JavaScript. */
export default async function UnsubscribePage({ searchParams }: Props) {
  const { t, r } = await searchParams;
  const token = typeof t === "string" ? t.slice(0, 200) : "";
  return (
    <div className="container-page max-w-xl pt-16 pb-24 text-center">
      <h1 className="text-4xl">Unsubscribe</h1>
      {r === "ok" ? (
        <>
          <p className="mt-4 text-ink/80">Done. We won&apos;t send you a cart reminder email again.</p>
          <Link href="/shop" className="btn btn-outline mt-8 inline-flex">
            Back to the shop
          </Link>
        </>
      ) : r === "invalid" || (!token && r !== "later") ? (
        <>
          <p className="mt-4 text-ink/80">This link doesn&apos;t look right, or it has expired. If you still get emails you don&apos;t want, write to us on the contact page and we&apos;ll take care of it.</p>
          <Link href="/contact" className="btn btn-outline mt-8 inline-flex">
            Contact us
          </Link>
        </>
      ) : (
        <form method="POST" action="/api/reminders/unsubscribe" className="mt-4">
          <p className="text-ink/80">{r === "later" ? "We couldn't do that just now. Please try again in a few minutes." : "Stop the cart reminder email?"}</p>
          <input type="hidden" name="t" value={token} />
          <button type="submit" className="btn btn-primary mt-8">
            Unsubscribe
          </button>
        </form>
      )}
    </div>
  );
}
