#!/usr/bin/env node

/**
 * Build Performance Measurement Script
 * Measures and compares build times before and after optimizations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '..', 'build-performance-results.json');

function measureBuildTime(buildCommand, label) {
  console.log(`\n🚀 Starting ${label}...`);
  const startTime = Date.now();
  
  try {
    // Clean .next folder first
    const nextDir = path.join(__dirname, '..', '.next');
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log('🧹 Cleaned .next folder');
    }
    
    // Run build command
    execSync(buildCommand, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { 
        ...process.env, 
        NEXT_TELEMETRY_DISABLED: '1',
        NODE_ENV: 'production'
      }
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n✅ ${label} completed in ${duration.toFixed(2)} seconds`);
    return { success: true, duration, timestamp: new Date().toISOString() };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.error(`\n❌ ${label} failed after ${duration.toFixed(2)} seconds`);
    console.error(error.message);
    return { success: false, duration, error: error.message, timestamp: new Date().toISOString() };
  }
}

function saveResults(results) {
  try {
    let existingResults = {};
    if (fs.existsSync(RESULTS_FILE)) {
      existingResults = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    }
    
    const updatedResults = {
      ...existingResults,
      ...results,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(updatedResults, null, 2));
    console.log(`\n📊 Results saved to ${RESULTS_FILE}`);
  } catch (error) {
    console.error('Failed to save results:', error.message);
  }
}

function compareResults() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.log('\n📊 No previous results found for comparison');
    return;
  }
  
  try {
    const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    
    console.log('\n📊 Build Performance Comparison:');
    console.log('=' .repeat(50));
    
    if (results.beforeOptimization && results.afterOptimization) {
      const before = results.beforeOptimization.duration;
      const after = results.afterOptimization.duration;
      const improvement = ((before - after) / before * 100).toFixed(1);
      const timeSaved = (before - after).toFixed(2);
      
      console.log(`Before Optimization: ${before.toFixed(2)}s`);
      console.log(`After Optimization:  ${after.toFixed(2)}s`);
      console.log(`Time Saved:          ${timeSaved}s`);
      console.log(`Improvement:         ${improvement}%`);
      
      if (improvement > 0) {
        console.log(`\n🎉 Build time improved by ${improvement}%!`);
      } else {
        console.log(`\n⚠️  Build time increased by ${Math.abs(improvement)}%`);
      }
    }
    
    if (results.fastBuild) {
      console.log(`\nFast Build (--no-lint): ${results.fastBuild.duration.toFixed(2)}s`);
    }
    
  } catch (error) {
    console.error('Failed to compare results:', error.message);
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'before':
      const beforeResult = measureBuildTime('npm run build', 'Build Before Optimization');
      saveResults({ beforeOptimization: beforeResult });
      break;
      
    case 'after':
      const afterResult = measureBuildTime('npm run build', 'Build After Optimization');
      saveResults({ afterOptimization: afterResult });
      compareResults();
      break;
      
    case 'fast':
      const fastResult = measureBuildTime('npm run build -- --no-lint', 'Fast Build (No Lint)');
      saveResults({ fastBuild: fastResult });
      break;
      
    case 'compare':
      compareResults();
      break;
      
    default:
      console.log('\n📏 Build Performance Measurement Tool');
      console.log('\nUsage:');
      console.log('  node scripts/measure-build-time.js before   # Measure before optimization');
      console.log('  node scripts/measure-build-time.js after    # Measure after optimization');
      console.log('  node scripts/measure-build-time.js fast     # Measure fast build (--no-lint)');
      console.log('  node scripts/measure-build-time.js compare  # Compare results');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { measureBuildTime, saveResults, compareResults };