import React from "react";
import { Umbrella, AlertCircle, Coffee } from "lucide-react";

/**
 * دائرة تقدّم (Circular Progress) — نسخة محكمة ومضمونة.
 * ترسم نسبة value/max على شكل قوس دائري متدرّج اللون.
 * عند تغيّر value (مثل خصم الرصيد) يتحرك القوس بسلاسة.
 */
const CircularProgress = ({ value, max, label, type }) => {
  // أبعاد ثابتة ومتناسقة مع الـ viewBox (لا قص للأطراف)
  const SIZE = 120; // أبعاد الـ viewBox
  const STROKE = 12; // عرض الخط
  const radius = (SIZE - STROKE) / 2; // 54 — يضمن عدم خروج الخط عن الإطار
  const center = SIZE / 2; // 60
  const circumference = 2 * Math.PI * radius;

  // قيم آمنة
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeMax = Number.isFinite(Number(max)) ? Number(max) : 0;

  // النسبة (0..100). لو max=0 وفيه رصيد => ممتلئة (لتجنب القسمة على صفر)
  let percentage;
  if (safeMax > 0) {
    percentage = Math.min(Math.max((safeValue / safeMax) * 100, 0), 100);
  } else {
    percentage = safeValue > 0 ? 100 : 0;
  }

  const dashOffset = circumference * (1 - percentage / 100);

  const config = {
    annual: {
      from: "#3b82f6",
      to: "#1e3a8a",
      bgClass: "bg-blue-50/50",
      icon: (
        <Umbrella className="w-3 h-3 md:w-5 md:h-5 text-blue-500 mb-0 md:mb-1" />
      ),
    },
    casual: {
      from: "#f59e0b",
      to: "#b45309",
      bgClass: "bg-yellow-50/50",
      icon: (
        <AlertCircle className="w-3 h-3 md:w-5 md:h-5 text-yellow-500 mb-0 md:mb-1" />
      ),
    },
    compensation: {
      from: "#10b981",
      to: "#047857",
      bgClass: "bg-green-50/50",
      icon: (
        <Coffee className="w-3 h-3 md:w-5 md:h-5 text-green-500 mb-0 md:mb-1" />
      ),
    },
  };

  const cfg = config[type] || config.annual;
  const gradId = `grad-${type}`;

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-2 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden ${cfg.bgClass}`}
    >
      <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-white/40 rounded-full blur-lg md:blur-xl -mr-4 -mt-4 md:-mr-6 md:-mt-6 pointer-events-none"></div>

      <div className="relative flex items-center justify-center mb-1.5 md:mb-3">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-16 h-16 md:w-32 md:h-32 -rotate-90"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cfg.from} />
              <stop offset="100%" stopColor={cfg.to} />
            </linearGradient>
          </defs>

          {/* المسار الخلفي (رمادي فاتح) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={STROKE}
          />

          {/* قوس التقدّم */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>

        {/* المحتوى في المنتصف */}
        <div className="absolute flex flex-col items-center justify-center">
          {cfg.icon}
          <span className="text-base md:text-3xl font-bold text-gray-700 leading-none">
            {safeValue}
          </span>
          <span className="text-[8px] md:text-[11px] font-semibold text-gray-400">
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
