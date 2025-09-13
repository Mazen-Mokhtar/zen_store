// Advanced bundle analysis and optimization utilities

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  recommendations: OptimizationRecommendation[];
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isAsync: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface DependencyInfo {
  name: string;
  size: number;
  version: string;
  treeshakeable: boolean;
  alternatives?: string[];
}

interface OptimizationRecommendation {
  type: 'split' | 'lazy' | 'remove' | 'replace' | 'compress';
  target: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
}

// Bundle size thresholds (in bytes)
export const BUNDLE_THRESHOLDS = {
  CRITICAL: 50 * 1024, // 50KB
  WARNING: 100 * 1024, // 100KB
  ERROR: 250 * 1024, // 250KB
  CHUNK_MAX: 200 * 1024, // 200KB per chunk
  DEPENDENCY_MAX: 50 * 1024 // 50KB per dependency
};

// Critical dependencies that should be monitored
export const CRITICAL_DEPENDENCIES = [
  'react',
  'react-dom',
  'next',
  '@next/font',
  'lucide-react'
];

// Dependencies that can be lazy loaded
export const LAZY_LOADABLE_DEPENDENCIES = [
  'chart.js',
  'react-chartjs-2',
  'framer-motion',
  'react-spring',
  'three',
  '@react-three/fiber'
];

// Analyze bundle composition
export class BundleAnalyzer {
  private analysis: BundleAnalysis | null = null;

  async analyzeBundleSize(): Promise<BundleAnalysis> {
    try {
      // In a real implementation, this would integrate with webpack-bundle-analyzer
      // For now, we'll simulate the analysis
      const analysis = await this.simulateBundleAnalysis();
      this.analysis = analysis;
      return analysis;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw new Error('Failed to analyze bundle');
    }
  }

  private async simulateBundleAnalysis(): Promise<BundleAnalysis> {
    // Simulate bundle analysis - in production, integrate with actual tools
    return {
      totalSize: 850 * 1024, // 850KB
      gzippedSize: 280 * 1024, // 280KB
      chunks: [
        {
          name: 'main',
          size: 320 * 1024,
          gzippedSize: 110 * 1024,
          modules: ['react', 'react-dom', 'next'],
          isAsync: false,
          priority: 'high'
        },
        {
          name: 'dashboard',
          size: 180 * 1024,
          gzippedSize: 65 * 1024,
          modules: ['dashboard/*', 'ui/glare-card'],
          isAsync: true,
          priority: 'medium'
        },
        {
          name: 'category',
          size: 150 * 1024,
          gzippedSize: 55 * 1024,
          modules: ['category-dashboard/*'],
          isAsync: true,
          priority: 'medium'
        }
      ],
      dependencies: [
        {
          name: 'react',
          size: 45 * 1024,
          version: '18.2.0',
          treeshakeable: false
        },
        {
          name: 'lucide-react',
          size: 85 * 1024,
          version: '0.263.1',
          treeshakeable: true,
          alternatives: ['react-icons', 'heroicons']
        }
      ],
      recommendations: [
        {
          type: 'split',
          target: 'lucide-react',
          impact: 'high',
          description: 'Split icon imports to reduce bundle size',
          estimatedSavings: 60 * 1024
        }
      ]
    };
  }

  generateOptimizationReport(): string {
    if (!this.analysis) {
      return 'No analysis available. Run analyzeBundleSize() first.';
    }

    const { totalSize, gzippedSize, chunks, recommendations } = this.analysis;
    
    let report = '\n=== Bundle Analysis Report ===\n';
    report += `Total Size: ${this.formatBytes(totalSize)}\n`;
    report += `Gzipped Size: ${this.formatBytes(gzippedSize)}\n`;
    report += `Compression Ratio: ${((1 - gzippedSize / totalSize) * 100).toFixed(1)}%\n\n`;

    report += '=== Chunks Analysis ===\n';
    chunks.forEach(chunk => {
      const status = chunk.size > BUNDLE_THRESHOLDS.CHUNK_MAX ? '⚠️' : '✅';
      report += `${status} ${chunk.name}: ${this.formatBytes(chunk.size)} (${chunk.isAsync ? 'async' : 'sync'})\n`;
    });

    report += '\n=== Optimization Recommendations ===\n';
    recommendations.forEach((rec, index) => {
      const impact = rec.impact === 'high' ? '🔴' : rec.impact === 'medium' ? '🟡' : '🟢';
      report += `${impact} ${index + 1}. ${rec.description}\n`;
      report += `   Target: ${rec.target}\n`;
      report += `   Estimated Savings: ${this.formatBytes(rec.estimatedSavings)}\n\n`;
    });

    return report;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if bundle size is within acceptable limits
  validateBundleSize(): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    if (!this.analysis) {
      return {
        isValid: false,
        warnings: [],
        errors: ['No analysis available']
      };
    }

    const warnings: string[] = [];
    const errors: string[] = [];

    // Check total bundle size
    if (this.analysis.totalSize > BUNDLE_THRESHOLDS.ERROR) {
      errors.push(`Total bundle size (${this.formatBytes(this.analysis.totalSize)}) exceeds maximum threshold`);
    } else if (this.analysis.totalSize > BUNDLE_THRESHOLDS.WARNING) {
      warnings.push(`Total bundle size (${this.formatBytes(this.analysis.totalSize)}) is approaching the limit`);
    }

    // Check individual chunks
    this.analysis.chunks.forEach(chunk => {
      if (chunk.size > BUNDLE_THRESHOLDS.CHUNK_MAX) {
        warnings.push(`Chunk '${chunk.name}' (${this.formatBytes(chunk.size)}) is too large`);
      }
    });

    // Check dependencies
    this.analysis.dependencies.forEach(dep => {
      if (dep.size > BUNDLE_THRESHOLDS.DEPENDENCY_MAX) {
        warnings.push(`Dependency '${dep.name}' (${this.formatBytes(dep.size)}) is too large`);
      }
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}

// Utility function to create bundle analyzer instance
export const createBundleAnalyzer = (): BundleAnalyzer => {
  return new BundleAnalyzer();
};

// Hook for bundle analysis in React components
export const useBundleAnalysis = () => {
  const analyzer = createBundleAnalyzer();
  
  const runAnalysis = async () => {
    try {
      const analysis = await analyzer.analyzeBundleSize();
      const validation = analyzer.validateBundleSize();
      const report = analyzer.generateOptimizationReport();
      
      return {
        analysis,
        validation,
        report,
        success: true
      };
    } catch (error) {
      return {
        analysis: null,
        validation: { isValid: false, warnings: [], errors: [String(error)] },
        report: '',
        success: false
      };
    }
  };

  return { runAnalysis };
};