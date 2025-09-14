module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Production-only CSS optimization plugins
    ...(process.env.NODE_ENV === 'production' && {
      'cssnano': {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyParams: true
        }]
      }
    })
  },
}
