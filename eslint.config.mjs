import antfu from '@antfu/eslint-config'

export default antfu({}, {
  files: ['examples/gold-tweet.js'],
}, {
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
