import Link from "next/link";

const shopLinks = [
  { label: "All Sarees", href: "/sarees" },
  { label: "Featured Picks", href: "/featured" },
  { label: "Collections", href: "/collections" },
  { label: "Browse Shops", href: "/shops" },
];

const communityLinks = [
  { label: "Sell on Handloom Stores", href: "/auth/register" },
  { label: "Sign in", href: "/auth/login" },
  { label: "Create an account", href: "/auth/register" },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-rose-100 bg-[#fffaf7] text-slate-700">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-10">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
            Woven with meaning
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Handloom Stores
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            A considered home for authentic handloom sarees, independent weaving
            stores, and the stories behind every beautiful weave.
          </p>
          <p className="mt-5 text-sm font-medium text-slate-800">
            Discover the hands, heritage, and craft of Mangalagiri.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-950">
            Explore
          </h3>
          <nav aria-label="Explore links" className="mt-4 flex flex-col items-start gap-3">
            {shopLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="text-sm text-slate-600 transition-colors hover:text-rose-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-950">
            Join the community
          </h3>
          <nav aria-label="Community links" className="mt-4 flex flex-col items-start gap-3">
            {communityLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="text-sm text-slate-600 transition-colors hover:text-rose-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-950">
            Contact
          </h3>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm text-slate-600">
            <a
              href="tel:+919490704585"
              className="transition-colors hover:text-rose-600"
            >
              +91 9490704585
            </a>
            <a
              href="mailto:giridharsurya99@gmail.com"
              className="transition-colors hover:text-rose-600"
            >
              giridharsurya99@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-rose-100 bg-[#fffaf7] px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>Handloom Stores: bringing heirloom craft closer to you.</p>
        <p>Copyright 2026 HandloomStores.com. All rights reserved.</p>
      </div>
    </footer>
  );
}
