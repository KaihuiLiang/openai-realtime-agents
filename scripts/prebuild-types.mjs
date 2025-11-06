#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const OPENAPI_URL = `${BACKEND_URL}/openapi.json`;
const GENERATED_FILE = path.join('src', 'types', 'api.generated.ts');

function hash(content) {
  return createHash('sha256').update(content).digest('hex');
}

(async function main() {
  try {
    if (process.env.SKIP_TYPEGEN === '1') {
      console.log('⏩ SKIP_TYPEGEN=1 set, skipping type generation.');
      process.exit(0);
    }

    console.log(`→ Checking backend availability at: ${OPENAPI_URL}`);
    // Use curl with silent+fail to check availability
    try {
      execSync(`curl -sf ${OPENAPI_URL} > /dev/null`, { stdio: 'ignore' });
    } catch {
      console.log('⚠ Backend unavailable, skipping type generation.');
      process.exit(0);
    }

    const prev = existsSync(GENERATED_FILE) ? readFileSync(GENERATED_FILE, 'utf8') : '';
    const prevHash = prev ? hash(prev) : 'NONE';

    console.log('→ Backend reachable. Generating types...');
    execSync(`npx openapi-typescript ${OPENAPI_URL} -o ${GENERATED_FILE} --alphabetize --export-type`, {
      stdio: 'inherit',
    });

    const next = existsSync(GENERATED_FILE) ? readFileSync(GENERATED_FILE, 'utf8') : '';
    const nextHash = next ? hash(next) : 'NONE';

    if (prevHash === nextHash) {
      console.log('✓ No type changes detected.');
    } else {
      console.log('🆕 Type definitions changed.');
    }
  } catch (err) {
    console.error('❌ prebuild type generation failed (non-blocking):', err?.message || err);
    // Do not fail the build; exit success.
    process.exit(0);
  }
})();
