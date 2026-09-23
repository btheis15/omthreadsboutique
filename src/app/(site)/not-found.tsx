import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page max-w-xl py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl md:text-5xl">We couldn&apos;t find that page</h1>
      <p className="mt-4 text-muted">It may have sold out or moved. Let&apos;s find you something lovely instead.</p>
      <Link href="/shop" className="btn btn-primary mt-8">
        Browse the collection
      </Link>
    </div>
  );
}
