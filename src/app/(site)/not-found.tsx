import Link from "next/link";
import { getT } from "@/lib/catalog";

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="container-page max-w-xl py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{t("notFoundTitle")}</h1>
      <p className="mt-4 text-muted">{t("notFoundBody")}</p>
      <Link href="/shop" className="btn btn-primary mt-8">
        {t("notFoundButton")}
      </Link>
    </div>
  );
}
