'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Username() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!name.trim()) {
      setError("⚠️ Please enter a valid username");
      return;
    }

    // ✅ Save username in localStorage
    localStorage.setItem("face_username", name.trim());
    setError('');
    setStep(2);
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-cyan-200 p-6">
      <div className="max-w-lg w-full bg-gray-700 shadow-lg rounded-2xl p-8">
        
        {/* Step 1: Username Input */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white">Step 1: Enter your name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-4 w-full border rounded-lg p-2"
            />
            {error && <p className="text-red-400 mt-2">{error}</p>}
            <button
              onClick={handleContinue}
              className="mt-6 w-full px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Face Verification */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-white text-center">
              Step 2: Face Verification
            </h2>

            {/* Image Guidelines */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Center Face */}
              <div className="flex flex-col items-center">
                <Image
                  src="/images/center-image.png"  // ✅ replace with your image in /public/
                  alt="Look straight"
                  width={120}
                  height={120}
                  className="rounded-lg shadow-md"
                />
                <p className="mt-2 text-sm text-gray-200">Look straight</p>
              </div>

              {/* Turn Left */}
              <div className="flex flex-col items-center">
                <Image
                  src="/images/left_image.png"
                  alt="Turn left"
                  width={120}
                  height={120}
                  className="rounded-lg shadow-md"
                />
                <p className="mt-2 text-sm text-gray-200">Turn left</p>
              </div>

              {/* Turn Right */}
              <div className="flex flex-col items-center">
                <Image
                  src="/images/right_image.png"
                  alt="Turn right"
                  width={120}
                  height={120}
                  className="rounded-lg shadow-md"
                />
                <p className="mt-2 text-sm text-gray-200">Turn right</p>
              </div>
            </div>

            {/* Extra Tips */}
            <ul className="mt-6 space-y-2 text-gray-200 text-sm">
              <li>✅ Your face must be clearly visible</li>
              <li>✅ Use a plain background</li>
              <li>✅ Ensure good lighting</li>
            </ul>

            <button
              onClick={() => router.push('/register')}
              className="mt-6 w-full px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Proceed to Register
            </button>
          </div>
        )}
      </div>
    </section>
  );
}



// 'use client'
// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function Username() {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [name, setName] = useState('');
//   const [error, setError] = useState('');

//   const handleContinue = () => {
//     if (!name.trim()) {
//       setError("⚠️ Please enter a valid username");
//       return;
//     }

//     // ✅ Save username in localStorage
//     localStorage.setItem("username", name.trim());
//     setError('');
//     setStep(2);
//   };

//   return (
//     <section className="min-h-screen flex items-center justify-center bg-cyan-200 p-6">
//       <div className="max-w-md w-full bg-gray-500 shadow-lg rounded-2xl p-8">
//         {step === 1 && (
//           <div>
//             <h2 className="text-2xl font-bold text-white">Step 1: Enter your name</h2>
//             <input
//               type="text"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="Your name"
//               className="mt-4 w-full border rounded-lg p-2"
//             />
//             {error && <p className="text-red-400 mt-2">{error}</p>}
//             <button
//               onClick={handleContinue}
//               className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Continue
//             </button>
//           </div>
//         )}

//         {step === 2 && (
//           <div>
//             <h2 className="text-2xl font-bold text-white">Step 2: Face Verification</h2>
//             <p className="mt-4 text-gray-200">[Camera preview and verification logic goes here]</p>
//             <button
//               onClick={() => router.push('/register')}
//               className="mt-6 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//             >
//               Proceed to Register
//             </button>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }
