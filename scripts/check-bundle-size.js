#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MAX_JS_SIZE_KB = 250; // Maximum JavaScript bundle size in KB
const MAX_CSS_SIZE_KB = 50;  // Maximum CSS bundle size in KB
const MAX_TOTAL_SIZE_KB = 300; // Maximum total bundle size in KB

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatKB(kb) {
  return `${kb.toFixed(2)} KB`;
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function findFiles(dir, extension) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          traverse(fullPath);
        } else if (item.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeBundleSize() {
  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static');
  
  if (!fs.existsSync(buildDir)) {
    logError('Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  if (!fs.existsSync(staticDir)) {
    logError('Static directory not found. Build may have failed.');
    process.exit(1);
  }
  
  // Find all JavaScript and CSS files
  const jsFiles = findFiles(staticDir, '.js');
  const cssFiles = findFiles(staticDir, '.css');
  
  // Calculate sizes
  let totalJsSize = 0;
  let totalCssSize = 0;
  const jsFileDetails = [];
  const cssFileDetails = [];
  
  // Analyze JavaScript files
  for (const file of jsFiles) {
    const size = getFileSize(file);
    const sizeKB = size / 1024;
    const relativePath = path.relative(staticDir, file);
    
    // Skip source maps and other non-essential files
    if (!file.includes('.map') && !file.includes('webpack-runtime')) {
      totalJsSize += size;
      jsFileDetails.push({ path: relativePath, size, sizeKB });
    }
  }
  
  // Analyze CSS files
  for (const file of cssFiles) {
    const size = getFileSize(file);
    const sizeKB = size / 1024;
    const relativePath = path.relative(staticDir, file);
    
    if (!file.includes('.map')) {
      totalCssSize += size;
      cssFileDetails.push({ path: relativePath, size, sizeKB });
    }
  }
  
  const totalJsSizeKB = totalJsSize / 1024;
  const totalCssSizeKB = totalCssSize / 1024;
  const totalSizeKB = totalJsSizeKB + totalCssSizeKB;
  
  return {
    js: {
      files: jsFileDetails,
      totalSize: totalJsSize,
      totalSizeKB: totalJsSizeKB
    },
    css: {
      files: cssFileDetails,
      totalSize: totalCssSize,
      totalSizeKB: totalCssSizeKB
    },
    total: {
      size: totalJsSize + totalCssSize,
      sizeKB: totalSizeKB
    }
  };
}

function generateBundleReport(analysis) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📦 BUNDLE SIZE ANALYSIS REPORT', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // JavaScript Analysis
  log('\n📄 JavaScript Files:', 'blue');
  log('-'.repeat(40), 'blue');
  
  const sortedJsFiles = analysis.js.files.sort((a, b) => b.sizeKB - a.sizeKB);
  
  for (const file of sortedJsFiles.slice(0, 10)) { // Show top 10 largest files
    const sizeColor = file.sizeKB > 50 ? 'red' : file.sizeKB > 25 ? 'yellow' : 'green';
    log(`  ${file.path.padEnd(35)} ${formatKB(file.sizeKB)}`, sizeColor);
  }
  
  if (sortedJsFiles.length > 10) {
    log(`  ... and ${sortedJsFiles.length - 10} more files`, 'white');
  }
  
  log(`\n  Total JavaScript: ${formatKB(analysis.js.totalSizeKB)}`, 'bold');
  
  // CSS Analysis
  if (analysis.css.files.length > 0) {
    log('\n🎨 CSS Files:', 'blue');
    log('-'.repeat(40), 'blue');
    
    const sortedCssFiles = analysis.css.files.sort((a, b) => b.sizeKB - a.sizeKB);
    
    for (const file of sortedCssFiles) {
      const sizeColor = file.sizeKB > 20 ? 'red' : file.sizeKB > 10 ? 'yellow' : 'green';
      log(`  ${file.path.padEnd(35)} ${formatKB(file.sizeKB)}`, sizeColor);
    }
    
    log(`\n  Total CSS: ${formatKB(analysis.css.totalSizeKB)}`, 'bold');
  }
  
  // Total Analysis
  log('\n📊 Summary:', 'magenta');
  log('-'.repeat(40), 'magenta');
  log(`  Total Bundle Size: ${formatKB(analysis.total.sizeKB)}`, 'bold');
  log(`  JavaScript: ${formatKB(analysis.js.totalSizeKB)} (${((analysis.js.totalSizeKB / analysis.total.sizeKB) * 100).toFixed(1)}%)`);
  log(`  CSS: ${formatKB(analysis.css.totalSizeKB)} (${((analysis.css.totalSizeKB / analysis.total.sizeKB) * 100).toFixed(1)}%)`);
}

function checkBundleLimits(analysis) {
  let hasErrors = false;
  let hasWarnings = false;
  
  log('\n🎯 Bundle Size Validation:', 'cyan');
  log('-'.repeat(40), 'cyan');
  
  // Check JavaScript size limit
  if (analysis.js.totalSizeKB > MAX_JS_SIZE_KB) {
    logError(`JavaScript bundle exceeds limit: ${formatKB(analysis.js.totalSizeKB)} > ${formatKB(MAX_JS_SIZE_KB)}`);
    hasErrors = true;
  } else if (analysis.js.totalSizeKB > MAX_JS_SIZE_KB * 0.9) {
    logWarning(`JavaScript bundle approaching limit: ${formatKB(analysis.js.totalSizeKB)} (${formatKB(MAX_JS_SIZE_KB)} max)`);
    hasWarnings = true;
  } else {
    logSuccess(`JavaScript bundle within limit: ${formatKB(analysis.js.totalSizeKB)} ≤ ${formatKB(MAX_JS_SIZE_KB)}`);
  }
  
  // Check CSS size limit
  if (analysis.css.totalSizeKB > MAX_CSS_SIZE_KB) {
    logError(`CSS bundle exceeds limit: ${formatKB(analysis.css.totalSizeKB)} > ${formatKB(MAX_CSS_SIZE_KB)}`);
    hasErrors = true;
  } else if (analysis.css.totalSizeKB > MAX_CSS_SIZE_KB * 0.9) {
    logWarning(`CSS bundle approaching limit: ${formatKB(analysis.css.totalSizeKB)} (${formatKB(MAX_CSS_SIZE_KB)} max)`);
    hasWarnings = true;
  } else {
    logSuccess(`CSS bundle within limit: ${formatKB(analysis.css.totalSizeKB)} ≤ ${formatKB(MAX_CSS_SIZE_KB)}`);
  }
  
  // Check total size limit
  if (analysis.total.sizeKB > MAX_TOTAL_SIZE_KB) {
    logError(`Total bundle exceeds limit: ${formatKB(analysis.total.sizeKB)} > ${formatKB(MAX_TOTAL_SIZE_KB)}`);
    hasErrors = true;
  } else if (analysis.total.sizeKB > MAX_TOTAL_SIZE_KB * 0.9) {
    logWarning(`Total bundle approaching limit: ${formatKB(analysis.total.sizeKB)} (${formatKB(MAX_TOTAL_SIZE_KB)} max)`);
    hasWarnings = true;
  } else {
    logSuccess(`Total bundle within limit: ${formatKB(analysis.total.sizeKB)} ≤ ${formatKB(MAX_TOTAL_SIZE_KB)}`);
  }
  
  return { hasErrors, hasWarnings };
}

function provideSuggestions(analysis) {
  log('\n💡 Optimization Suggestions:', 'yellow');
  log('-'.repeat(40), 'yellow');
  
  const suggestions = [];
  
  // Large JavaScript files
  const largeJsFiles = analysis.js.files.filter(file => file.sizeKB > 50);
  if (largeJsFiles.length > 0) {
    suggestions.push('Consider code splitting for large JavaScript files:');
    largeJsFiles.forEach(file => {
      suggestions.push(`  - ${file.path} (${formatKB(file.sizeKB)})`);
    });
  }
  
  // Too many small files (potential bundling issue)
  const smallJsFiles = analysis.js.files.filter(file => file.sizeKB < 5);
  if (smallJsFiles.length > 10) {
    suggestions.push(`Consider bundling ${smallJsFiles.length} small JavaScript files together`);
  }
  
  // General suggestions
  if (analysis.js.totalSizeKB > MAX_JS_SIZE_KB * 0.8) {
    suggestions.push('Enable tree shaking to remove unused code');
    suggestions.push('Use dynamic imports for non-critical code');
    suggestions.push('Consider using a smaller UI library or framework');
    suggestions.push('Implement route-based code splitting');
  }
  
  if (analysis.css.totalSizeKB > MAX_CSS_SIZE_KB * 0.8) {
    suggestions.push('Remove unused CSS with tools like PurgeCSS');
    suggestions.push('Use CSS-in-JS for component-scoped styles');
  }
  
  if (suggestions.length === 0) {
    logSuccess('Bundle size is optimal! No suggestions at this time.');
  } else {
    suggestions.forEach(suggestion => {
      log(`  • ${suggestion}`, 'yellow');
    });
  }
}

function saveBundleReport(analysis) {
  const reportPath = path.join(process.cwd(), 'bundle-size-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    limits: {
      maxJsSizeKB: MAX_JS_SIZE_KB,
      maxCssSizeKB: MAX_CSS_SIZE_KB,
      maxTotalSizeKB: MAX_TOTAL_SIZE_KB
    },
    analysis,
    status: {
      jsWithinLimit: analysis.js.totalSizeKB <= MAX_JS_SIZE_KB,
      cssWithinLimit: analysis.css.totalSizeKB <= MAX_CSS_SIZE_KB,
      totalWithinLimit: analysis.total.sizeKB <= MAX_TOTAL_SIZE_KB
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`Bundle report saved to: ${reportPath}`);
}

function main() {
  try {
    logInfo('Starting bundle size analysis...');
    
    // Ensure build exists
    if (!fs.existsSync(path.join(process.cwd(), '.next'))) {
      logInfo('Building project first...');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    // Analyze bundle
    const analysis = analyzeBundleSize();
    
    // Generate report
    generateBundleReport(analysis);
    
    // Check limits
    const { hasErrors, hasWarnings } = checkBundleLimits(analysis);
    
    // Provide suggestions
    provideSuggestions(analysis);
    
    // Save report
    saveBundleReport(analysis);
    
    // Exit with appropriate code
    if (hasErrors) {
      log('\n❌ Bundle size check FAILED! Please optimize your bundle.', 'red');
      process.exit(1);
    } else if (hasWarnings) {
      log('\n⚠️  Bundle size check passed with warnings.', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ Bundle size check PASSED!', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    logError(`Bundle size check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  checkBundleLimits,
  MAX_JS_SIZE_KB,
  MAX_CSS_SIZE_KB,
  MAX_TOTAL_SIZE_KB
};