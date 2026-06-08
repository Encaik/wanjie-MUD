import nextTs from 'eslint-config-next/typescript';
import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  // ============================================================
  // Quality Gate: All TypeScript/TSX source files
  // ============================================================
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'import': importPlugin,
    },
    rules: {
      // ---- TypeScript Strictness ----
      '@typescript-eslint/no-explicit-any': 'error',

      // ---- Import Order ----
      // React → 3rd party → @/ alias → relative
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'type',
        ],
        'pathGroups': [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        'pathGroupsExcludedImportTypes': ['react'],
        'newlines-between': 'always',
        'alphabetize': {
          order: 'asc',
          caseInsensitive: true,
        },
      }],

      // ---- Complexity Limits ----
      'complexity': ['warn', 15],
      'max-depth': ['warn', 4],

      // ---- Unused Variables ----
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },

  // ============================================================
  // Override: Test files — relaxed rules
  // ============================================================
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ============================================================
  // Override: barrel/index files — allow re-exports without usage warning
  // ============================================================
  {
    files: ['**/index.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);

export default eslintConfig;
