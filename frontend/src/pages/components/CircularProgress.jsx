import React from "react";
import { Umbrella, AlertCircle, Coffee } from "lucide-react";

const CircularProgress = ({ value, max, label, type }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // قيمة آمنة (تتجنب NaN)
  const safeValue = isNaN(value) ? 0 : Number(value);
  const safeMax = isNaN(max) ? 0 : Number(max);

  // النسبة: محصورة بين 0 و 100
  // ملاحظة: لو max=0 (مثل بدل الراحة بلا سقف معروف) نعرض دائرة ممتلئة
  // عندما يكون هناك رصيد، بدلاً من تركها فارغة دائماً.
  let percentage;
  if (safeMax > 0) {
    percentage = Math.min(Math.max((safeValue / safeMax) * 100, 0), 100);
  } else {
    percentage = safeValue > 0 ? 100 : 0;
  }

  const offset = circumference - (percentage / 100) * circumference;

  const config = {
    annual: {
      gradient: ["#3b82f6", "#1e3a8a"],
      shadow: "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
      bgClass: "bg-blue-50/50",
      icon: (
        <Umbrella className="w-3 h-3 md:w-5 md:h-5 text-blue-500 mb-0 md:mb-1" />
      ),
    },
    casual: {
      gradient: ["#f59e0b", "#b45309"],
      shadow: "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
      bgClass: "bg-yellow-50/50",
      icon: (
        <AlertCircle className="w-3 h-3 md:w-5 md:h-5 text-yellow-500 mb-0 md:mb-1" />
      ),
    },
    compensation: {
      gradient: ["#10b981", "#047857"],
      shadow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]",
      bgClass: "bg-green-50/50",
      icon: (
        <Coffee className="w-3 h-3 md:w-5 md:h-5 text-green-500 mb-0 md:mb-1" />
      ),
    },
  };

  const currentConfig = config[type] || config.annual;

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-2 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${currentConfig.bgClass}`}
    >
      <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-white/40 rounded-full blur-lg md:blur-xl -mr-4 -mt-4 md:-mr-6 md:-mt-6 pointer-events-none"></div>

      <div className="relative flex items-center justify-center mb-1.5 md:mb-3">
        <svg
          viewBox="0 0 160 160"
          className="transform -rotate-90 w-16 h-16 md:w-32 md:h-32"
        >
          <defs>
            <linearGradient
              id={`gradient-${type}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={currentConfig.gradient[0]} />
              <stop offset="100%" stopColor={currentConfig.gradient[1]} />
            </linearGradient>
          </defs>

          {/* الخلفية الرمادية */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth="8"
            fill="transparent"
          />

          {/* دائرة التقدّم */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={`url(#gradient-${type})`}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            // ✅ استخدمنا duration-1000 (قيمة Tailwind صحيحة) + style لمدة مخصصة
            // عشان الـ transition يشتغل بسلاسة لما القيمة تتغير (الخصم)
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
            className={currentConfig.shadow}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center mt-0.5 md:mt-0">
          {currentConfig.icon}
          <div className="flex items-baseline gap-0.5 md:gap-1">
            <span className="text-base md:text-3xl font-bold text-gray-700 tracking-tight leading-none">
              {safeValue}
            </span>
          </div>
          <span className="text-[8px] md:text-[11px] font-semibold text-gray-400 mt-0 md:mt-0.5">
            يوم
          </span>
        </div>
      </div>

      <span className="text-[9px] md:text-sm font-bold text-gray-700 bg-white px-2 py-1 md:px-4 md:py-1.5 rounded-full shadow-sm border border-gray-100/50 text-center whitespace-nowrap">
        {label}
      </span>
    </div>
  );
};

export default CircularProgress;
