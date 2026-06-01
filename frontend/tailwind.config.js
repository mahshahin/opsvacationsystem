/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          light: '#2563eb', // درجة أزرق/كحلي فاتح مريحة للعين
          dark: '#1e3a8a',  // درجة كحلي غامق للتأثيرات
        }
      }
    },
  },
  plugins: [],
}