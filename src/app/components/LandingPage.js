"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const texts = ["No email", "No password", "With face"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Different animations & colors
  const animationClasses = ["flip-up", "flip-down", "flip-rotate"];
  const colors = ["text-red-600", "text-red-500", "text-green-600"];

  return (
    <section className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Text Section */}
        <div className="p-8 bg-white rounded-2xl shadow-xl flex flex-col justify-center text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center h-32">
            <p
              key={texts[index]}
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold ${colors[index]} ${animationClasses[index]} text-shadow`}
            >
              {texts[index]}
            </p>
          </div>

          <p className="mt-4 text-gray-600 text-base sm:text-lg">
            Quick sign in with face — no email or password required.
          </p>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Experience seamless and secure access powered by face authentication.
          </p>
   <div className="flex flex-col gap-4 w-full sm:w-auto sm:flex-col md:flex-row md:gap-6 items-center justify-center">
  <Link href="/user" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition">
    Get Started
  </Link>
  <Link href="/login" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold shadow-sm hover:bg-gray-50 transition">
    Login
  </Link>
</div>
        </div>

        {/* Illustration (your SVG stays here) */}
        <div className="p-6 bg-white rounded-2xl shadow-xl flex items-center justify-center">
          {/* Your SVG */}
           {/* Illustration */}
          <svg
            className="w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96"
            viewBox="0 0 600 600"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Face authentication illustration"
          >
            <defs>
              <linearGradient id="bg" x1="0" x2="1">
                <stop offset="0" stopColor="#eff6ff" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <rect
              x="10"
              y="10"
              width="580"
              height="580"
              rx="30"
              fill="url(#bg)"
            />
            <circle
              cx="220"
              cy="260"
              r="110"
              fill="#ffffff"
              stroke="#c7d2fe"
              strokeWidth="6"
            />
            <circle cx="190" cy="240" r="12" fill="#0f172a" />
            <circle cx="250" cy="240" r="12" fill="#0f172a" />
            <path
              d="M180 300 q40 30 80 0"
              stroke="#0f172a"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <rect x="360" y="120" width="160" height="320" rx="18" fill="#0f172a" />
            <rect x="375" y="145" width="130" height="260" rx="8" fill="#ffffff" />
            <circle cx="440" cy="430" r="6" fill="#c7d2fe" />
            <path
              d="M340 200 q-40 20 -90 30"
              stroke="#60a5fa"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
            <path
              d="M340 260 q-60 30 -110 40"
              stroke="#60a5fa"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeOpacity="0.6"
            />
          </svg>
    
        </div>
      </div>
    </section>
  );
}
