// src: eslint.config.mjs

import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

const isProduction = process.env.NODE_ENV === 'production'
const isStaging = process.env.NODE_ENV === 'staging'

export default withNuxt(
  // your custom flat configs go here, for example:
  {
    ...prettier,
    rules: {
      'no-console': isProduction ? 'error' : isStaging ? 'warn' : 'off', // allow console.log in TypeScript files

      // These rules should be enabled after fixing all the code
      '@typescript-eslint/no-unused-vars': [
        'off',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'vue/html-self-closing': 'off',
    },
  }
)
