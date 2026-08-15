"use client";

import React from "react";
import Image from "next/image";
import { getApiBaseUrl } from "@/lib/apiClient";
import resolveImageUrl from "@/lib/resolveImage";

type Props = {
  src?: string | null;
  alt?: string;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  sizes?: string;
};

export default function BackendImage({ src, alt, fill = false, className = "", style, priority, sizes }: Props) {
  const resolved = resolveImageUrl(src) || "";

  // If resolved URL points to the configured API host, avoid next/image optimization
  // which can block private IPs — render a plain <img> instead.
  const apiBase = getApiBaseUrl();
  const isBackendHost = resolved.startsWith(apiBase);
  const isBlobOrData = resolved.startsWith("blob:") || resolved.startsWith("data:");

  if (isBackendHost || isBlobOrData) {
    // For fill layout, parent containers are expected to control sizing/positioning.
    const imgClass = `${className} ${fill ? "w-full h-full object-cover" : ""}`.trim();
    return <img src={resolved} alt={alt || ""} className={imgClass} style={style} />;
  }

  // Next.js requires a positioned parent when `fill` is enabled. Wrap the image so
  // remote Azure blob URLs behave like the local static assets while keeping the same
  // layout contract for circular avatars and cards.
  if (fill) {
    return (
      <span className="relative block h-full w-full">
        <Image src={resolved} alt={alt || ""} fill className={className} style={style} priority={priority} sizes={sizes} />
      </span>
    );
  }

  return <Image src={resolved} alt={alt || ""} width={0} height={0} className={className} style={style} priority={priority} sizes={sizes} />;
}
