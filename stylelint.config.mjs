export default {
  extends: ['stylelint-config-recommended'],
  ignoreFiles: ['dist/**', '.angular/**', 'coverage/**', 'tmp/**', 'node_modules/**'],
  rules: {
    'selector-max-id': 0,
    'max-nesting-depth': 3,
  },
  overrides: [
    {
      files: ['**/*.scss'],
      extends: ['stylelint-config-recommended-scss'],
      rules: {
        'at-rule-disallowed-list': ['import'],
        'scss/at-use-no-unnamespaced': true,
      },
    },
  ],
};
