// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function FaceRegister() {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [progress, setProgress] = useState(0);
//   const [instruction, setInstruction] = useState("Align your face inside the oval");
//   const router = useRouter();

//   useEffect(() => {
//     if (!videoRef.current || !window.FaceMesh || !window.Camera) return;

//     const faceMesh = new window.FaceMesh({
//       locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//     });

//     faceMesh.setOptions({
//       maxNumFaces: 1,
//       refineLandmarks: true,
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5,
//     });

//     faceMesh.onResults((results) => {
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext("2d");
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

//       if (results.multiFaceLandmarks?.length) {
//         const nose = results.multiFaceLandmarks[0][1]; // nose tip
//         if (nose.x < 0.4) {
//           setProgress(50);
//           setInstruction("Now turn right");
//         } else if (nose.x > 0.6 && progress === 50) {
//           setProgress(100);
//           setInstruction("✅ Registration complete!");

//           // Save embedding to localStorage
//           localStorage.setItem(
//             "faceData",
//             JSON.stringify(results.multiFaceLandmarks[0])
//           );

//           // Redirect to login
//           setTimeout(() => router.push("/login"), 1000);
//         }
//       }
//     });

//     const camera = new window.Camera(videoRef.current, {
//       onFrame: async () => {
//         await faceMesh.send({ image: videoRef.current });
//       },
//       width: 640,
//       height: 480,
//     });

//     camera.start();
//   }, [progress, router]);

//   return (
//     <div className="flex flex-col items-center p-4">
//       <h2 className="text-xl font-bold mb-2">Face Registration</h2>
//       <p className="mb-2">{instruction}</p>
//       <progress value={progress} max="100" className="w-64 mb-2" />
//       <div className="relative">
//         <video ref={videoRef} className="hidden" />
//         <canvas ref={canvasRef} width="640" height="480" className="rounded-xl shadow" />
//         <div className="absolute inset-0 border-4 border-green-500 rounded-full pointer-events-none" />
//       </div>
//     </div>
//   );
// }
