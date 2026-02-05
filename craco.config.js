const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig, { env }) => {
      // Strip console.log/warn/info/debug in production (smaller bundle, no debug leakage)
      if (env === 'production' && Array.isArray(webpackConfig.optimization?.minimizer)) {
        for (const plugin of webpackConfig.optimization.minimizer) {
          try {
            if (plugin?.constructor?.name === 'TerserPlugin' && plugin.options?.terserOptions?.compress) {
              plugin.options.terserOptions.compress.drop_console = true;
              break;
            }
          } catch (_) { /* ignore */ }
        }
      }
      // Ensure TypeScript path aliases work
      const existingAlias = webpackConfig.resolve.alias || {};
      webpackConfig.resolve.alias = {
        ...existingAlias,
        '@': path.resolve(__dirname, 'src'),
      };
      
      // Ensure TypeScript extensions are prioritized
      // Create React App already includes .tsx and .ts, but ensure they're first
      const extensions = webpackConfig.resolve.extensions || [];
      const otherExtensions = extensions.filter(ext => !['.ts', '.tsx'].includes(ext));
      webpackConfig.resolve.extensions = [
        '.tsx',
        '.ts',
        ...otherExtensions,
      ];
      
      // Ensure modules can be resolved from src
      if (!webpackConfig.resolve.modules) {
        webpackConfig.resolve.modules = ['node_modules'];
      }
      // Add src to modules so we can import from src root
      const modules = Array.isArray(webpackConfig.resolve.modules) 
        ? webpackConfig.resolve.modules 
        : [webpackConfig.resolve.modules].filter(Boolean);
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'src'),
        ...modules,
      ];
      
      // Override PostCSS configuration to use @tailwindcss/postcss for Tailwind v4
      const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
      if (oneOfRule) {
        oneOfRule.oneOf.forEach((rule) => {
          if (rule.use && Array.isArray(rule.use)) {
            rule.use.forEach((use) => {
              if (use.loader && use.loader.includes('postcss-loader')) {
                // Override PostCSS options
                if (!use.options) {
                  use.options = {};
                }
                // Set postcssOptions to use @tailwindcss/postcss
                use.options.postcssOptions = {
                  plugins: [
                    require('@tailwindcss/postcss'),
                    require('autoprefixer'),
                  ],
                };
              }
            });
          }
        });
      }
      
      return webpackConfig;
    },
  },
};
