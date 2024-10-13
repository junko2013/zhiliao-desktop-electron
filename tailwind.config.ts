import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
const config: Config = {
  content: [
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    nextui(),
    function ({
      addUtilities,
    }: {
      addUtilities: (utilities: Record<string, any>) => void;
    }) {
      const newUtilities = {
        //可拖动
        ".draggable": {
          "-webkit-app-region": "drag",
        },
        //不可拖动
        ".non-draggable": {
          "-webkit-app-region": "no-drag",
        },
        //鼠标不可滑动选择文本
        ".non-select": {
          "user-select": "none",
          "-webkit-user-select": "none",
          "-moz-user-select": "none",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
export default config;
