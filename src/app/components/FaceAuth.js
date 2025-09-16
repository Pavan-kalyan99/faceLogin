"use client";
import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export default function FaceAuth({ onResults = () => {}, instruction, progress, active = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const processingRef = useRef(false); // prevent overlapping detections

  useEffect(() => {
    if (!active) return;

    let running = true;

    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        runDetection();
      };
    };

    const runDetection = async () => {
      if (!running || !videoRef.current) return;
      if (processingRef.current) {
        animationRef.current = requestAnimationFrame(runDetection);
        return;
      }

      processingRef.current = true;

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const landmarks = detection.landmarks.positions;
        onResults(landmarks);

        // Draw
        const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
        const resized = faceapi.resizeResults(detection, dims);
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resized);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      }

      processingRef.current = false;
      animationRef.current = requestAnimationFrame(runDetection);
    };

    loadModels();

    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [onResults, active]);

  return (
<div className="flex flex-col items-center justify-center p-4 relative w-full ">
        <img src="/images/head_ref.gif" alt="Loading animation" className="m-1 p-2 w-30 h-30 rounded-2xl" />

  <div className="relative w-full max-w-md aspect-video">
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover rounded-lg"
    />
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
    />
  </div>

  <p className="mt-2 text-center font-semibold">{instruction}</p>
  {progress !== undefined && (
    <progress value={progress} max="100" className="w-64 mt-2" />
  )}
</div>

  );
}



// "use client";
// import { useEffect, useRef } from "react";
// import * as faceapi from "face-api.js";

// export default function FaceAuth({ onResults = () => {}, instruction, progress, active = true }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     if (!active) return; // stop detection if not active
//     let intervalId;

//     const loadModels = async () => {
//       const MODEL_URL = "/models";
//       await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
//       await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
//       await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       videoRef.current.srcObject = stream;

//       videoRef.current.onloadedmetadata = () => {
//         videoRef.current.play();
//         intervalId = setInterval(runDetection, 500);
//       };
//     };

//     const runDetection = async () => {
//       if (!videoRef.current) return;

//       const detection = await faceapi
//         .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
//         .withFaceLandmarks()
//         .withFaceDescriptor();

//       if (!detection) return;

//       const landmarks = detection.landmarks.positions;
//       onResults(landmarks); // pass landmarks to parent (Register)

//       // draw
//       const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
//       const resized = faceapi.resizeResults(detection, dims);
//       faceapi.draw.drawDetections(canvasRef.current, resized);
//       faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
//     };

//     loadModels();

//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [onResults, active]);

//   return (
//     <div className="flex flex-col items-center p-4 relative">
//       <video ref={videoRef} autoPlay muted playsInline width="640" height="480" />
//       <canvas ref={canvasRef} width="640" height="480" className="absolute top-0 left-0 pointer-events-none" />
//       <p className="mt-2 text-center font-semibold">{instruction}</p>
//       {progress !== undefined && <progress value={progress} max="100" className="w-64 mt-2" />}
//     </div>
//   );
// }

// -----------------------



