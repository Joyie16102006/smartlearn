"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => router.push("/dashboard"), 400);
  };

  const handleOAuth = () => {
    setIsLoading(true);
    setTimeout(() => router.push("/dashboard"), 300);
  };

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* ─── LEFT PANEL: Dark Branding ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-[#0D1117] overflow-hidden">
        {/* Globe SVG / radial illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Concentric glow circles */}
          <div className="absolute w-[700px] h-[700px] rounded-full border border-white/[0.04]" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-white/[0.05]" />
          <div className="absolute w-[420px] h-[420px] rounded-full border border-white/[0.06]" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-white/[0.07]" />

          {/* Globe SVG mockup */}
          <svg
            viewBox="0 0 480 480"
            className="w-[420px] h-[420px] opacity-80"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="globeGrad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="100%" stopColor="#070e1a" />
              </radialGradient>
              <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4880FF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4880FF" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Outer glow */}
            <circle cx="240" cy="240" r="240" fill="url(#glowGrad)" />
            {/* Globe sphere */}
            <circle cx="240" cy="240" r="200" fill="url(#globeGrad)" opacity="0.9" />

            {/* Latitude lines */}
            <ellipse cx="240" cy="240" rx="200" ry="60" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.3" />
            <ellipse cx="240" cy="240" rx="200" ry="110" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.25" />
            <ellipse cx="240" cy="240" rx="200" ry="160" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.2" />
            <ellipse cx="240" cy="170" rx="200" ry="60" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.2" />
            <ellipse cx="240" cy="310" rx="200" ry="60" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.2" />

            {/* Longitude lines */}
            <ellipse cx="240" cy="240" rx="70" ry="200" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.25" />
            <ellipse cx="240" cy="240" rx="130" ry="200" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.2" />
            <ellipse cx="240" cy="240" rx="180" ry="200" fill="none" stroke="#4880FF" strokeWidth="0.5" strokeOpacity="0.15" />

            {/* Continent dots — static values to avoid SSR hydration mismatch */}
            {([
              [200,180,1.8,0.55],[210,170,1.8,0.62],[215,162,1.2,0.70],[225,168,1.2,0.47],
              [235,165,1.2,0.58],[245,170,1.8,0.44],[255,165,1.2,0.66],[265,172,1.8,0.72],
              [270,180,1.2,0.51],[260,188,1.2,0.48],[250,185,1.8,0.60],[240,182,1.2,0.55],
              [230,180,1.8,0.50],[215,178,1.8,0.65],[275,210,1.2,0.57],[285,205,1.8,0.42],
              [295,212,1.8,0.68],[290,222,1.2,0.53],[280,220,1.2,0.49],[270,215,1.2,0.61],
              [160,230,1.8,0.45],[170,225,1.8,0.58],[180,232,1.2,0.52],[175,240,1.8,0.44],
              [165,238,1.8,0.67],[190,300,1.2,0.54],[200,295,1.2,0.48],[210,302,1.8,0.72],
              [205,310,1.8,0.56],[195,308,1.2,0.63],[290,275,1.2,0.47],[300,270,1.8,0.59],
              [310,278,1.2,0.70],[305,285,1.8,0.44],[295,282,1.2,0.66],[230,250,1.2,0.53],
              [240,245,1.8,0.49],[250,252,1.8,0.62],[245,260,1.2,0.57],[235,258,1.2,0.71],
            ] as [number,number,number,number][]).map(([cx, cy, r, opacity], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="#7EB6FF"
                opacity={opacity}
              />
            ))}

            {/* Highlighted nodes (cities/learners) */}
            {[
              [225, 168, "#4880FF"],
              [265, 172, "#4ADE80"],
              [285, 205, "#4880FF"],
              [295, 278, "#FBBF24"],
              [175, 238, "#4ADE80"],
            ].map(([cx, cy, color], i) => (
              <g key={`node-${i}`}>
                <circle cx={cx as number} cy={cy as number} r="5" fill={color as string} opacity="0.3" />
                <circle cx={cx as number} cy={cy as number} r="2.5" fill={color as string} opacity="0.9" />
              </g>
            ))}

            {/* Connection arc lines */}
            <path d="M225,168 Q245,150 265,172" fill="none" stroke="#4880FF" strokeWidth="0.8" strokeOpacity="0.5" />
            <path d="M265,172 Q280,188 285,205" fill="none" stroke="#4880FF" strokeWidth="0.8" strokeOpacity="0.4" />
            <path d="M175,238 Q200,215 225,168" fill="none" stroke="#4ADE80" strokeWidth="0.7" strokeOpacity="0.35" />

            {/* Sphere overlay rim */}
            <circle cx="240" cy="240" r="200" fill="none" stroke="white" strokeWidth="0.6" strokeOpacity="0.08" />
          </svg>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* Logo top left */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white rounded-sm flex items-center justify-center">
              <span className="text-[#0D1117] font-black text-lg leading-none tracking-tighter">S</span>
            </div>
            <div className="w-3 h-3 bg-[#4880FF] rounded-sm" />
          </div>

          {/* Welcome copy at bottom left */}
          <div className="space-y-3">
            <p className="text-white/60 text-sm font-medium tracking-wide">
              Welcome to
            </p>
            <h2 className="text-white text-3xl font-extrabold leading-tight tracking-tight">
              SmartLearn<br />Community
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Home to adaptive AI-powered learning for students and learners worldwide
            </p>
            <button
              onClick={handleOAuth}
              className="text-[#4880FF] text-sm font-semibold hover:text-blue-400 transition-colors"
            >
              Know more →
            </button>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Auth Form ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-[400px] space-y-6">

          {/* Heading */}
          <div className="space-y-1.5">
            <p className="text-slate-500 text-sm font-medium">
              {isSignUp ? "Join us" : "Welcome back"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {isSignUp
                ? "Create a SmartLearn account"
                : "Sign in to SmartLearn"}
            </h1>
            <p className="text-sm text-slate-500">
              {isSignUp ? (
                <>
                  Be part of a{" "}
                  <span className="text-[#4880FF] font-semibold">10k+ learner</span>{" "}
                  community
                </>
              ) : (
                "Enter your credentials to resume your learning path"
              )}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 text-sm rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 focus:border-[#4880FF] transition-all bg-white"
                />
              </div>
            )}

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 text-sm rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 focus:border-[#4880FF] transition-all bg-white"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 pr-11 text-sm rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4880FF]/30 focus:border-[#4880FF] transition-all bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Terms checkbox (only on sign up, mirrors HackerRank) */}
            {isSignUp && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#4880FF] cursor-pointer"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to SmartLearn's{" "}
                  <span className="text-[#4880FF] hover:underline cursor-pointer">Terms of Service</span>{" "}
                  and{" "}
                  <span className="text-[#4880FF] hover:underline cursor-pointer">Privacy Policy</span>.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={isLoading || (isSignUp && !agreed)}
              className="w-full py-3 rounded-lg bg-[#4880FF] hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isSignUp ? "Sign up" : "Sign in"}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-4 text-xs font-medium text-slate-400 bg-white">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            {/* Google — full width (matches reference) */}
            <button
              type="button"
              onClick={handleOAuth}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path fill="#EA4335" d="M12 5c1.55 0 2.95.54 4.05 1.58l3.03-3.03C17.25 1.83 14.82 1 12 1 7.54 1 3.73 3.56 1.88 7.28l3.66 2.84C6.41 7.28 8.98 5 12 5z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.69 2.86c2.16-1.99 3.42-4.93 3.42-8.68z"/>
                <path fill="#FBBC05" d="M5.54 14.88c-.24-.71-.38-1.47-.38-2.27 0-.8.14-1.56.38-2.27L1.88 7.5C1.19 8.87.8 10.39.8 12s.39 3.13 1.08 4.5l3.66-2.84z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.86c-1.08.72-2.45 1.16-4.24 1.16-3.02 0-5.59-2.28-6.46-5.12L1.88 16.5C3.73 20.22 7.54 23 12 23z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* GitHub + LinkedIn split row (matches reference exactly) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleOAuth}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
              >
                {/* LinkedIn */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0A66C2]">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>LinkedIn</span>
              </button>

              <button
                type="button"
                onClick={handleOAuth}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
              >
                {/* GitHub */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#24292e]">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>

          {/* Footer link (matches reference "Already have an account? Log in") */}
          <p className="text-center text-sm text-slate-500">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-[#4880FF] font-semibold hover:underline"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-[#4880FF] font-semibold hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
