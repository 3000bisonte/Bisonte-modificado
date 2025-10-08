"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface SlideData {
  img: string;
}

interface HeroSliderProps {
  slides?: SlideData[];
  autoPlayInterval?: number;
}

const DEFAULT_SLIDES: SlideData[] = [
  { img: "/slider/slider1.jpg" },
  { img: "/slider/slider2.jpg" },
  { img: "/slider/slider3.jpg" },
];

export default function HeroSlider({ 
  slides = DEFAULT_SLIDES, 
  autoPlayInterval = 5000 
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const prevSlide = () => setCurrentSlide((s) => (s === 0 ? slides.length - 1 : s - 1));
  const nextSlide = () => setCurrentSlide((s) => (s === slides.length - 1 ? 0 : s + 1));

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((s) => (s === slides.length - 1 ? 0 : s + 1));
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [slides.length, autoPlayInterval]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {return;}
    (track as HTMLDivElement & { touchStartX?: number }).touchStartX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {return;}
    const startX = (track as HTMLDivElement & { touchStartX?: number }).touchStartX;
    if (startX === undefined) {return;}

    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = startX - touchEndX;
    
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {return;}
    (track as HTMLDivElement & { mouseStartX?: number }).mouseStartX = e.clientX;
    track.style.cursor = "grabbing";
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {return;}
    const startX = (track as HTMLDivElement & { mouseStartX?: number }).mouseStartX;
    if (startX === undefined) {return;}

    const mouseEndX = e.clientX;
    const swipeDistance = startX - mouseEndX;
    
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    track.style.cursor = "grab";
  };

  const handleMouseLeave = () => {
    const track = trackRef.current;
    if (!track) {return;}
    track.style.cursor = "grab";
  };

  return (
    <div className="relative w-full h-[350px] overflow-hidden rounded-2xl shadow-lg mb-8 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500">
      <div
        ref={trackRef}
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)`, cursor: "grab" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {slides.map((slideItem, index) => (
          <div key={index} className="min-w-full h-full flex-shrink-0 relative">
            <Image
              src={slideItem.img}
              alt={`Slide ${index + 1}`}
              fill
              style={{ objectFit: "cover" }}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-md transition-all z-10"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-md transition-all z-10"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSlide === index ? "bg-white w-8" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
