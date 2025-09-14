// Webpack tree shaking optimization plugin

class TreeShakingOptimizationPlugin {
  constructor(options = {}) {
    this.options = {
      // Libraries to optimize for tree shaking
      optimizeLibraries: [
        'lucide-react',
        'react-icons',
        'framer-motion',
        '@radix-ui/react-label',
        '@radix-ui/react-separator',
        '@radix-ui/react-slot'
      ],
      // Enable aggressive optimization
      aggressive: true,
      ...options
    };
  }

  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('TreeShakingOptimizationPlugin', (factory) => {
      factory.hooks.module.tap('TreeShakingOptimizationPlugin', (module, createData) => {
        const { resource } = createData;
        
        if (resource) {
          // Mark specific libraries as side-effect free
          this.options.optimizeLibraries.forEach(lib => {
            if (resource.includes(`node_modules/${lib}/`)) {
              // Force side effects to false for better tree shaking
              if (module.factoryMeta) {
                module.factoryMeta.sideEffectFree = true;
              }
            }
          });
          
          // Optimize icon imports
          if (resource.includes('react-icons/') || resource.includes('lucide-react/')) {
            // Mark icon modules as side-effect free
            if (module.factoryMeta) {
              module.factoryMeta.sideEffectFree = true;
            }
          }
        }
        
        return module;
      });
    });

    // Optimize chunk splitting for better tree shaking
    compiler.hooks.thisCompilation.tap('TreeShakingOptimizationPlugin', (compilation) => {
      compilation.hooks.optimizeChunks.tap('TreeShakingOptimizationPlugin', (chunks) => {
        // Additional chunk optimization logic can be added here
        if (this.options.aggressive) {
          chunks.forEach(chunk => {
            // Mark chunks for aggressive optimization
            chunk.canBeInitial = () => false;
          });
        }
      });
    });
  }
}

// Babel plugin for better tree shaking of icon libraries
const createIconTreeShakingPlugin = () => {
  return {
    name: 'icon-tree-shaking',
    visitor: {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        
        // Transform react-icons imports for better tree shaking
        if (source.startsWith('react-icons/')) {
          const specifiers = path.node.specifiers;
          if (specifiers.length > 0 && specifiers[0].type === 'ImportDefaultSpecifier') {
            // Convert default imports to named imports for better tree shaking
            const iconName = specifiers[0].local.name;
            path.node.specifiers = [{
              type: 'ImportSpecifier',
              imported: { type: 'Identifier', name: iconName },
              local: { type: 'Identifier', name: iconName }
            }];
          }
        }
        
        // Transform lucide-react imports
        if (source === 'lucide-react') {
          const specifiers = path.node.specifiers;
          // Ensure named imports for better tree shaking
          specifiers.forEach(spec => {
            if (spec.type === 'ImportDefaultSpecifier') {
              spec.type = 'ImportSpecifier';
              spec.imported = spec.local;
            }
          });
        }
      }
    }
  };
};

// Configuration for package.json sideEffects optimization
const packageSideEffectsConfig = {
  // Mark these packages as side-effect free
  sideEffectFreePackages: [
    'lucide-react',
    'react-icons',
    'clsx',
    'class-variance-authority',
    'tailwind-merge'
  ],
  
  // Patterns for side-effect free files
  sideEffectFreePatterns: [
    '**/*.module.css',
    '**/icons/**/*.js',
    '**/utils/**/*.js',
    '**/constants/**/*.js'
  ]
};

// Webpack resolve configuration for better tree shaking
const createResolveConfig = () => {
  return {
    // Enable tree shaking for ES modules
    mainFields: ['es2015', 'module', 'main'],
    
    // Alias for optimized imports
    alias: {
      // Use ES module versions when available
      'react-icons': 'react-icons/lib',
      'lucide-react': 'lucide-react/dist/esm'
    },
    
    // Extensions for better resolution
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  };
};

module.exports = {
  TreeShakingOptimizationPlugin,
  createIconTreeShakingPlugin,
  packageSideEffectsConfig,
  createResolveConfig
};