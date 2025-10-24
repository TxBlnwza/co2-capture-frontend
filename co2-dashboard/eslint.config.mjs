import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // เพิ่ม rules ปิด any type warnings
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-implicit-any-catch": "off",
    "react-hooks/exhaustive-deps": "warn", // เปลี่ยนจาก error เป็น warning
    "prefer-const": "warn",
    "@next/next/no-img-element": "off" // ปิดการเตือน img element
    }
  }
]);

export default eslintConfig;