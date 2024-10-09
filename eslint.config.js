import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    },
    ...tseslint.configs.recommended,
    {
        files: [
            "src/**/*.ts",
            "src/**/*.test.ts",
        ],
        ignores: [
            "build/",
            "dist/",
            "node_modules/",
            ".snapshots/",
            "*.min.js"
        ],
        rules: {
            "@typescript-eslint/no-explicit-any": "off"
        }
    }
];