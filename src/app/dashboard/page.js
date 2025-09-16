"use client";
import React from "react";
export default function Dashboard() {
 
  const username = localStorage.getItem("face_username");


  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">
        Welcome to your dashboard,
        <span className="text-3xl">
          🎉 {username || "Guest"} 🎉
          </span> 
      </h1>
    </div>
  );
}
