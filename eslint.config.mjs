export default [{
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: { 'no-unused-vars': ['error', { caughtErrors: 'none', argsIgnorePattern: '^_' }], 'no-unreachable': 'error', 'no-dupe-keys': 'error', 'no-constant-condition': 'error' }
}];
