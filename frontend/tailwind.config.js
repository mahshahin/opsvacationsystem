/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          light: "#2563eb", // درجة أزرق/كحلي فاتح مريحة للعين
          dark: "#1e3a8a", // درجة كحلي غامق للتأثيرات
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        fadeInUp: "fadeInUp 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
