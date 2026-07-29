"use client";

import { useState } from "react";

export default function SelectorEstrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1 not-italic">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl leading-none transition-transform hover:scale-110"
        >
          <span className={(hover || valor) >= n ? "text-mustard" : "text-ink/20"}>★</span>
        </button>
      ))}
    </div>
  );
}
