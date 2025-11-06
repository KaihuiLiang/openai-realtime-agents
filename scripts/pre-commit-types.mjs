#!/usr/bin/env node
import { execSync } from 'node:child_process';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const OPENAPI_URL = `${BACKEND_URL}/openapi.json`;

function isBackendAvailable() {
  try {
    execSync(`curl -sf ${OPENAPI_URL} > /dev/null`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

(function main() {
  console.log('🔍 Pre-commit: Checking for API type updates...');
  
  if (!isBackendAvailable()) {
    console.log('⚠️  Backend not available, skipping type generation');
    process.exit(0);
  }

  try {
    console.log('🔄 Backend available, regenerating types...');
    execSync('npm run generate:types', { stdio: 'inherit' });
    
    // Check if types changed
    const status = execSync('git status --porcelain src/types/api.generated.ts', { encoding: 'utf8' });
    
    if (status.trim()) {
      console.log('📝 Type definitions updated, adding to commit...');
      execSync('git add src/types/api.generated.ts', { stdio: 'inherit' });
      console.log('✅ Updated types added to commit\n');
    } else {
      console.log('✓ Types are up to date\n');
    }
  } catch (err) {
    console.error('⚠️  Type generation failed (non-blocking):', err?.message || err);
    // Don't fail the commit
  }

  process.exit(0);
})();
