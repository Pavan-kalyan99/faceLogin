"use client";
import Link from "next/link";
import React from "react";
import { useEffect, useState } from "react";

export default function Dashboard() {
   const [username, setUsername] = useState(null);

 useEffect(() => {
    const storedUser = localStorage.getItem("face_username");
    setUsername(storedUser);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold m-2">
        Welcome ,
        <span className="text-3xl">
          🎉 {username || "Guest"} 🎉
          </span> 
      </h1>
      <div className="w-full flex justify-center gap-4 pb-6">
    <Link
      href="/"
      className="px-4 py-2 bg-blue-600 rounded-xl text-white font-semibold shadow-md hover:bg-blue-700 transition text-sm sm:text-base"
    >
      🏠 Home
    </Link>
   </div>
    </div>
  );
}
