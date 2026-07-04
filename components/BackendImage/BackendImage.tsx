"use client";

import React from "react";
import Image from "next/image";
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
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  const isBackendHost = resolved.startsWith(apiBase);
  const isBlobOrData = resolved.startsWith("blob:") || resolved.startsWith("data:");

  if (isBackendHost || isBlobOrData) {
    // For fill layout, parent containers are expected to control sizing/positioning.
    const imgClass = `${className} ${fill ? "w-full h-full object-cover" : ""}`.trim();
    return <img src={resolved} alt={alt || ""} className={imgClass} style={style} />;
  }

  // Otherwise use Next.js Image for optimization
  return <Image src={resolved} alt={alt || ""} fill={fill} className={className} style={style} priority={priority} sizes={sizes} />;
}
