import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn', // Orange si une variable ne sert à rien
      '@typescript-eslint/no-explicit-any': 'error', // Rouge si tu utilises "any"
      'no-console': 'off', // Autorise les console.log
    },
  },
);
