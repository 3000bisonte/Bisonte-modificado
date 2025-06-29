"use client";
import { useState, useEffect } from "react";

export default function WithDelayLoader({ children, min = 5000, max = 10000 }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const delay = min + Math.random() * (max - min);
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [min, max]);

  if (loading) return null; // Next.js mostrará loading.js global

  return children;
}