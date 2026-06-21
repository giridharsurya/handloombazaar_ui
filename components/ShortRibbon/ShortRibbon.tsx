"use client";

import React from "react";
import Link from "next/link";

// export default function ShortRibbon() {
//   return (
//     <div className="w-full my-4 bg-rose-50 -mx-4 px-4 py-3">
//       <div className="bg-rose-600 text-white w-full py-2 flex gap-3 items-center justify-center rounded-md">
//         <Link href="/shops" className="px-3 py-1 rounded hover:bg-rose-500 transition-colors">Shops</Link>
//         <Link href="/categories" className="px-3 py-1 rounded hover:bg-rose-500 transition-colors">Categories</Link>
//       </div>
//     </div>
//   );
// }

export default function ShortRibbon() {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <nav className="bg-rose-600 text-white py-3">
        <div className="flex items-center justify-center gap-6">
          <Link
            href="/sarees"
            className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
          >
            Sarees
          </Link>
          <Link
            href="/shops"
            className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
          >
            Shops
          </Link>

          <Link
            href="/categories"
            className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/featured"
            className="px-3 py-1 rounded hover:bg-rose-500 transition-colors"
          >
            Featured
          </Link>
        </div>
      </nav>
    </div>
  );
}
