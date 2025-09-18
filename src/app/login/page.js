"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import FaceAuth from "../components/FaceAuth";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

const HOLD_FRAMES = 1;
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
// live land marks
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
export default function Login() {
  const [instruction, setInstruction] = useState("Align your face at CENTER");
  const [progress, setProgress] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  const finishedRef = useRef(false);
  const profileRef = useRef({ center: null, right: null, left: null });
  const holdRef = useRef({ center: 0, right: 0, left: 0 });
  const router = useRouter();

  const resetFlow = () => {
    profileRef.current = { center: null, right: null, left: null };
    holdRef.current = { center: 0, right: 0, left: 0 };
    finishedRef.current = false;
    setProgress(0);
    setInstruction("Align your face at CENTER");
    setShowRetry(false);
  };

  // helper: pick nose index depending on landmark model length
  function noseIndexFor(landmarks) {
    if (!Array.isArray(landmarks)) return 1;
    if (landmarks.length >= 468) return 1; // MediaPipe FaceMesh nose tip index
    if (landmarks.length === 68) return 30; // face-api.js 68-point nose tip
    // fallback: middle index
    return Math.floor(landmarks.length / 2);
  }
  const handleResults = async (rawLandmarks) => {
    if (finishedRef.current || showRetry) return;
  if (!rawLandmarks || !Array.isArray(rawLandmarks) || rawLandmarks.length === 0) return;

    // normalize to video size
    // const video = document.querySelector("video");
    // const vw = video?.videoWidth || 640;
    // const vh = video?.videoHeight || 480;

    const landmarks = normalizeLiveLandmarks(rawLandmarks)
    //  rawLandmarks.map((p) => ({ x: p.x / vw, y: p.y / vh }));
      if (!landmarks) return;

 // ✅ Nose index detection
  const noseIdx = noseIndexFor(landmarks);
  const nose = landmarks[noseIdx];
  if (!nose || typeof nose.x !== "number") return;

  const noseX = nose.x; // already normalized (0..1)

    // 1️⃣ CENTER
    if (!profileRef.current.center) {
      if (noseX > 0.45 && noseX < 0.55) {
        holdRef.current.center++;
        setInstruction(`Hold steady at CENTER... (${holdRef.current.center}/${HOLD_FRAMES})`);
        if (holdRef.current.center >= HOLD_FRAMES) {
          profileRef.current.center = landmarks;
          setProgress(33);
          setInstruction("✅ Center captured — Now TURN RIGHT 👈 ");
        }
      } else {
        holdRef.current.center = 0;
      }
      return;
    }

    // 2️⃣ RIGHT
    if (!profileRef.current.right) {
      if (noseX > 0.60) {
        holdRef.current.right++;
        setInstruction(`Hold steady RIGHT... (${holdRef.current.right}/${HOLD_FRAMES})`);
        if (holdRef.current.right >= HOLD_FRAMES) {
          profileRef.current.right = landmarks;
          setProgress(66);
          setInstruction("✅ Right captured — Now TURN LEFT 👉");
        }
      } else {
        holdRef.current.right = 0;
      }
      return;
    }

    // 3️⃣ LEFT
    if (!profileRef.current.left) {
      if (noseX < 0.40) {
        holdRef.current.left++;
        setInstruction(`Hold steady LEFT... (${holdRef.current.left}/${HOLD_FRAMES})`);
        if (holdRef.current.left >= HOLD_FRAMES) {
          profileRef.current.left = landmarks;
          setProgress(100);
          setInstruction("✅ Left captured — Verifying...");
          await verifyFace();
        }
      } else {
        holdRef.current.left = 0;
      }
      return;
    }
  };

  const verifyFace = async () => {
    try {
      const { data: profiles, error } = await supabase.from("face_profiles").select("id, center, left, right, username");
      if (error) {
        console.error("Error fetching profiles:", error);
        setInstruction("⚠️ Error fetching profiles");
        setShowRetry(true);
        return;
      }

      // const match = profiles.find((p) => {
      //   const centerMatch = euclideanDistance(p.center, profileRef.current.center) < 0.08;
      //   const rightMatch = euclideanDistance(p.right, profileRef.current.right) < 0.08;
      //   const leftMatch = euclideanDistance(p.left, profileRef.current.left) < 0.08;
      //   return centerMatch && rightMatch && leftMatch;
      // });

      // if (match) {
      //   setInstruction("✅ Face verified! Redirecting...");
      //   finishedRef.current = true;
      //   localStorage.setItem("face_profile_id", match.id);
      //   localStorage.setItem("face_username", match.username);
      //   setTimeout(() => router.push("/dashboard"), 800);
      // } else {
      //   setInstruction("❌ Face not recognized.");
      //   setShowRetry(true); // show button
      // }

// added---
let bestMatch = null;
    let bestScore = Infinity;
    const THRESH = 0.06; // same as Register

    for (const p of profiles || []) {
      const storedCenter = normalizeStoredLandmarks(p.center);
      const storedLeft = normalizeStoredLandmarks(p.left);
      const storedRight = normalizeStoredLandmarks(p.right);

      if (!storedCenter || !storedLeft || !storedRight) continue;

      const dCenter = stableDistance(storedCenter, profileRef.current.center);
      const dLeft = stableDistance(storedLeft, profileRef.current.left);
      const dRight = stableDistance(storedRight, profileRef.current.right);

      let matches = 0;
      if (dCenter < THRESH) matches++;
      if (dLeft < THRESH) matches++;
      if (dRight < THRESH) matches++;

      if (matches >= 2) {
      // console.log("✅ Duplicate detected with profile ID:", p.id);

        const avgScore = (dCenter + dLeft + dRight) / 3;
        if (avgScore < bestScore) {
          bestScore = avgScore;
          bestMatch = p;
        }
      }

      // console.log("Checking", p.username, { dCenter, dLeft, dRight, matches });
    }

    if (bestMatch) {
      console.log('bestmatch:',bestMatch)
      setInstruction(`✅ Welcome back, ${bestMatch.username}! Redirecting...`);
      finishedRef.current = true;

      localStorage.setItem("face_profile_id", bestMatch.id);
      localStorage.setItem("face_username", bestMatch.username);

      setTimeout(() => router.push("/dashboard"), 800);
    } else {
      setInstruction("❌ Face not recognized. Please try again.");
      setShowRetry(true);

    }

    } catch (err) {
      console.error("Unexpected error verifying face:", err);
      setInstruction("Unexpected error — try again.");
      setShowRetry(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <FaceAuth
        onResults={handleResults}
        instruction={instruction}
        progress={progress}
        active={!finishedRef.current && !showRetry}
      />
      {showRetry && (
        <button
          onClick={resetFlow}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Try Again
        </button>
      )}

<div className="w-full flex justify-center gap-4 mt-auto pb-6">
    <Link
      href="/"
      className="px-4 py-2 bg-blue-600 rounded-xl text-white font-semibold shadow-md hover:bg-blue-700 transition text-sm sm:text-base"
    >
      🏠 Home
    </Link>
    <Link
      href="/register"
      className="px-4 py-2 bg-green-600 rounded-xl text-white font-semibold shadow-md hover:bg-green-700 transition text-sm sm:text-base"
    >
      📝 Register
    </Link>
</div>
    </div>
  );
}

function euclideanDistance(arr1, arr2) {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const dx = arr1[i].x - arr2[i].x;
    const dy = arr1[i].y - arr2[i].y;
    sum += dx * dx + dy * dy;
  }
  return Math.sqrt(sum / arr1.length);
}


// "use client";
// import { useState, useRef } from "react";
// import { useRouter } from "next/navigation";
// import FaceAuth from "../components/FaceAuth";
// import { supabase } from "../lib/supabaseClient";

// // ---- distance util ----
// function euclideanDistance(arr1, arr2) {
//   if (!arr1 || !arr2 || arr1.length !== arr2.length) return Infinity;
//   let sum = 0;
//   for (let i = 0; i < arr1.length; i++) {
//     const dx = arr1[i].x - arr2[i].x;
//     const dy = arr1[i].y - arr2[i].y;
//     sum += dx * dx + dy * dy;
//   }
//   return Math.sqrt(sum / arr1.length);
// }

// export default function Login() {
//   const [instruction, setInstruction] = useState("Align your face at CENTER");
//   const [progress, setProgress] = useState(0);
//   const [active, setActive] = useState(true);

//   const profileRef = useRef({ center: null, right: null, left: null });
//   const router = useRouter();

//   const handleResults = async (landmarks) => {
//     if (!active) return; // stop if already done

//     // normalize coords
//     const video = document.querySelector("video");
//     const vw = video?.videoWidth || 640;
//     const vh = video?.videoHeight || 480;
//     const norm = landmarks.map((p) => ({ x: p.x / vw, y: p.y / vh }));

//     const nose = norm[30]; // nose tip

//     // Step 1: center
//     if (!profileRef.current.center) {
//       if (nose.x > 0.45 && nose.x < 0.55) {
//         profileRef.current.center = norm;
//         setInstruction("Now TURN RIGHT");
//         setProgress(33);
//       }
//       return;
//     }

//     // Step 2: right
//     if (!profileRef.current.right) {
//       if (nose.x > 0.60) {
//         profileRef.current.right = norm;
//         setInstruction("Now TURN LEFT");
//         setProgress(66);
//       }
//       return;
//     }

//     // Step 3: left
//     if (!profileRef.current.left) {
//       if (nose.x < 0.40) {
//         profileRef.current.left = norm;
//         setInstruction("✅ Captured — Verifying...");
//         setProgress(100);

//         // stop FaceAuth immediately
//         setActive(false);

//         await verifyFace();
//       }
//       return;
//     }
//   };

//   const verifyFace = async () => {
//     try {
//       const { data: profiles, error } = await supabase
//         .from("face_profiles")
//         .select("*");

//       if (error) {
//         console.error("Error fetching profiles:", error);
//         setInstruction("⚠️ Error fetching profiles");
//         return;
//       }

//       const match = profiles.find((p) => {
//         const dCenter = euclideanDistance(p.center, profileRef.current.center);
//         const dRight = euclideanDistance(p.right, profileRef.current.right);
//         const dLeft = euclideanDistance(p.left, profileRef.current.left);
//         console.log("Compare with profile:", p.id, { dCenter, dRight, dLeft });
//         return dCenter < 0.1 && dRight < 0.1 && dLeft < 0.1;
//       });

//       if (match) {
//         setInstruction("✅ Face verified! Redirecting...");
//         setTimeout(() => router.push("/dashboard"), 1000);
//       } else {
//         setInstruction("❌ Face not recognized. Try again.");
//       }
//     } catch (err) {
//       console.error("Unexpected error verifying face:", err);
//       setInstruction("Unexpected error — try again.");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <FaceAuth
//         onResults={handleResults}
//         instruction={instruction}
//         progress={progress}
//         active={active}
//       />
//     </div>
//   );
// }

