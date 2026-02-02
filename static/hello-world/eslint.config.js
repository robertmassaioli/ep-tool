import semistandard from 'eslint-config-semistandard';
import atlaskitDesignSystem from '@atlaskit/eslint-plugin-design-system';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        browser: true,
        es6: true,
        node: true
      }
    },
    plugins: {
      '@atlaskit/design-system': atlaskitDesignSystem,
      'react': react,
      'react-hooks': reactHooks
    },
    rules: {
      // Semistandard rules (need to be defined manually in flat config)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      
      // Atlaskit design token rules
      '@atlaskit/design-system/ensure-design-token-usage': 'error',
      '@atlaskit/design-system/no-deprecated-design-token-usage': 'warn',
      '@atlaskit/design-system/no-unsafe-design-token-usage': 'error',
      
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn'
    },
    settings: {
      react: {
        version: '16.14'
      }
    }
  }
];