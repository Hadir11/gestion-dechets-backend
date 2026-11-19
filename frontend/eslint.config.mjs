import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Quelques réponses d'API sont désérialisées en any plutôt que de définir
      // un type par endpoint : l'avertissement suffit, on ne bloque pas la CI.
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      // Le texte de l'interface est en français, les apostrophes sont partout.
      'react/no-unescaped-entities': 'off',
      // Destructuration volontaire pour retirer confirmPassword du payload.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // Règles du compilateur React activées par défaut en v16. Le code existant
      // les déclenche (setState dans un effet, redirections window.location).
      // Elles restent visibles sans casser le build, le temps de reprendre les pages.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      '@next/next/no-location-assign-relative-destination': 'warn',
    },
  },
];

export default config;
