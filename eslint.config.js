import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'graphify-out/**', 'assets/**', '.factory/evidence/**'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: { IDBDatabase: 'readonly', indexedDB: 'readonly', crypto: 'readonly', File: 'readonly' } },
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' }
  },
  {
    files: ['*.config.ts', 'tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' }
  },
  {
    files: ['public/sw.js'],
    languageOptions: { globals: { self: 'readonly', caches: 'readonly', fetch: 'readonly' } }
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly' } }
  },
  {
    files: ['api/**/*.cjs'],
    languageOptions: { globals: { module: 'readonly', require: 'readonly', fetch: 'writable', AbortSignal: 'readonly', Response: 'readonly', global: 'readonly', process: 'readonly' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' }
  }
);
