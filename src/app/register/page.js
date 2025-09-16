"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import FaceAuth from "../components/FaceAuth";
import { supabase } from "../lib/supabaseClient";

/**
 * stableDistance: works on normalized landmarks (x,y in 0..1)
 * ignores mouth landmarks (indexes 48..67 for 68-point model)
 */
function stableDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return Infinity;
  let sum = 0, count = 0;
  for (let i = 0; i < a.length; i++) {
    if (i >= 48 && i <= 67) continue; // ignore mouth area
    const dx = a[i].x - b[i].x;
    const dy = a[i].y - b[i].y;
    sum += dx * dx + dy * dy;
    count++;
  }
  return count === 0 ? Infinity : Math.sqrt(sum / count);
}

/**
 * Normalize a landmarks array to {x: number, y: number} in 0..1 space.
 * Detects whether incoming landmarks are pixel-based (>1) and divides by video size.
 */
function normalizeLiveLandmarks(rawLandmarks) {
  if (!Array.isArray(rawLandmarks) || rawLandmarks.length === 0) return null;

  const sample = rawLandmarks[0];
  const isPixel = typeof sample.x === "number" && sample.x > 1; // pixel coords likely
  if (!isPixel) {
    // already normalized 0..1
    return rawLandmarks.map((p) => ({ x: p.x, y: p.y }));
  }

  // pixel coords -> try to read the current video element to normalize
  const video = document.querySelector("video");
  const vw = video?.videoWidth || 640;
  const vh = video?.videoHeight || 480;
  return rawLandmarks.map((p) => ({ x: p.x / vw, y: p.y / vh }));
}

/**
 * Normalize landmarks returned from DB into {x,y} objects.
 * Accepts either [{x,y}, ...] or [[x,y], ...] or { ... } unusual shapes.
 */
function normalizeStoredLandmarks(dbArr) {
  if (!Array.isArray(dbArr) || dbArr.length === 0) return null;
  const out = [];
  for (const p of dbArr) {
    if (Array.isArray(p) && p.length >= 2) {
      out.push({ x: Number(p[0]), y: Number(p[1]) });
    } else if (p && typeof p === "object") {
      // if already {x,y}
      if (typeof p.x === "number" && typeof p.y === "number") {
        out.push({ x: p.x, y: p.y });
      } else {
        // fallback: take first two numeric values
        const vals = Object.values(p).map((v) => (typeof v === "number" ? v : NaN)).filter((v) => !Number.isNaN(v));
        if (vals.length >= 2) out.push({ x: vals[0], y: vals[1] });
      }
    }
  }
  return out.length ? out : null;
}

export default function Register() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [instruction, setInstruction] = useState("Align your face inside the oval");
  const [saving, setSaving] = useState(false);

  // store normalized landmarks (0..1) for each pose
  const profileRef = useRef({ center: null, left: null, right: null });
  const finishedRef = useRef(false);

  // helper: pick nose index depending on landmark model length
  function noseIndexFor(landmarks) {
    if (!Array.isArray(landmarks)) return 1;
    if (landmarks.length >= 468) return 1; // MediaPipe FaceMesh nose tip index
    if (landmarks.length === 68) return 30; // face-api.js 68-point nose tip
    // fallback: middle index
    return Math.floor(landmarks.length / 2);
  }

  const handleResults = async (rawLandmarks) => {
    if (saving || finishedRef.current) return;
    if (!rawLandmarks || !Array.isArray(rawLandmarks) || rawLandmarks.length === 0) return;

    // normalize incoming landmarks to 0..1 coordinates
    const normalized = normalizeLiveLandmarks(rawLandmarks);
    if (!normalized) return;

    // decide nose index (works for 68 or 468)
    const noseIdx = noseIndexFor(normalized);
    const nose = normalized[noseIdx];
    if (!nose || typeof nose.x !== "number") return;

    const noseX = nose.x; // already normalized 0..1 now

    // Step 1: center
    if (!profileRef.current.center) {
      if (noseX > 0.45 && noseX < 0.55) {
        profileRef.current.center = normalized;
        setProgress(30);
        setInstruction("✅ Center captured — Now turn LEFT 👉");
      }
      return;
    }

    // Step 2: left
    if (!profileRef.current.left) {
      if (noseX < 0.40) {
        profileRef.current.left = normalized;
        setProgress(60);
        setInstruction("✅ Left captured — Now turn RIGHT 👈");
      }
      return;
    }

    // Step 3: right
    if (!profileRef.current.right) {
      if (noseX > 0.60) {
        profileRef.current.right = normalized;
        setProgress(100);
        setInstruction("✅ Right captured — Saving...");
        // set finished to prevent re-entrance while saving
        finishedRef.current = true;
        await saveProfileToSupabase();
      }
      return;
    }
  };

  const saveProfileToSupabase = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // fetch existing profiles (only the landmark fields)
      const { data: existingProfiles, error: fetchError } = await supabase
        .from("face_profiles")
        .select("id, center, left, right");

      if (fetchError) {
        console.error("Error fetching profiles:", fetchError);
        setInstruction("⚠️ Could not check existing faces. Try again.");
        setSaving(false);
        finishedRef.current = false;
        return;
      }

      // Validate we have all three captured poses
      if (!profileRef.current.center || !profileRef.current.left || !profileRef.current.right) {
        setInstruction("⚠️ Incomplete captures. Try again.");
        setSaving(false);
        finishedRef.current = false;
        return;
      }

      // Compare against stored profiles
      let duplicate = null;
      for (const p of existingProfiles || []) {
        const storedCenter = normalizeStoredLandmarks(p.center);
        const storedLeft = normalizeStoredLandmarks(p.left);
        const storedRight = normalizeStoredLandmarks(p.right);

        // skip invalid stored rows
        if (!storedCenter || !storedLeft || !storedRight) {
          console.warn("Skipping invalid stored profile:", p.id);
          continue;
        }

        // if stored values appear to be pixel coords (>1) skip (we expect normalized)
        if (storedCenter.some(pt => pt.x > 1 || pt.y > 1)) {
          console.warn("Skipping non-normalized stored profile (not comparable):", p.id);
          continue;
        }

        const dCenter = stableDistance(storedCenter, profileRef.current.center);
        const dLeft = stableDistance(storedLeft, profileRef.current.left);
        const dRight = stableDistance(storedRight, profileRef.current.right);

  console.log("Checking profile ID:", p.id, {
    dCenter,
    dLeft,
    dRight,
  });

        // require 2 out of 3 poses to match under threshold
        let matches = 0;
        const THRESH = 0.06; // tuned for normalized coords; tweak lower to be stricter
        if (dCenter < THRESH) matches++;
        if (dLeft < THRESH) matches++;
        if (dRight < THRESH) matches++;

        if (matches >= 2) {
              console.log("✅ Duplicate detected with profile ID:", p.id);

          duplicate = p;
          break;
        }
      }

      if (duplicate) {
        setInstruction("⚠️ Face already registered. Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
        setSaving(false);
        return;
      }
     
      // Insert normalized landmarks into DB
      const username = localStorage.getItem("face_username");

      const payload = {
        username,
        center: profileRef.current.center,
        left: profileRef.current.left,
        right: profileRef.current.right,
      };

      const { data, error } = await supabase
        .from("face_profiles")
        .insert([payload])
        .select("id,username")
        .single();

      if (error) {
        console.error("Insert error:", error);
        setInstruction("❌ Failed to save profile. Try again.");
        setSaving(false);
        finishedRef.current = false;
        return;
      }

      // Save id locally and redirect
      localStorage.setItem("face_profile_id", data.id);
      setInstruction("✅ Profile saved! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      console.error("Unexpected error:", err);
      setInstruction("Unexpected error — try again.");
      finishedRef.current = false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">

    <FaceAuth
      onResults={handleResults}
      instruction={instruction}
      progress={progress}
      active={!finishedRef.current}
    />
    </div>
  );
}







 