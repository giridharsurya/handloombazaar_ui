"use client";

import React, { useRef, useState, useEffect } from "react";
import { RibbonProps } from "@/types";

export default function Ribbon<T>({ items, renderItem, title, action, className = "" }: RibbonProps<T>) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.6);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className={`my-6 relative bg-rose-50 py-4 -mx-4 px-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {action}
        </div>
      )}

      {/* Layout: Left Arrow | Images | Right Arrow */}
      <div className="flex items-center gap-4">
        {/* Left arrow space */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
          {canScrollLeft && (
            <button
              aria-label="Scroll left"
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-black"
            >
              ‹
            </button>
          )}
        </div>

        {/* Images scroll container */}
        <div ref={scrollerRef} className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-4 items-start">
            {items.map((item: any, index: number) => {
              const rendered = renderItem(item, index);
              if (React.isValidElement(rendered)) {
                const element = rendered as React.ReactElement<any>;
                return React.cloneElement(element, {
                  key: item.id ?? item.name,
                  className: `${(element.props.className ?? "").toString()} ribbon-item flex-shrink-0`.trim(),
                });
              }
              return (
                <div key={item.id ?? item.name} className="ribbon-item flex-shrink-0">
                  {rendered}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right arrow space */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
          {canScrollRight && (
            <button
              aria-label="Scroll right"
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-black"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
