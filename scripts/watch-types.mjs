#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const OPENAPI_URL = `${BACKEND_URL}/openapi.json`;
const GENERATED_FILE = path.join('src', 'types', 'api.generated.ts');
const POLL_INTERVAL_MS = parseInt(process.env.WATCH_INTERVAL || '3000', 10);

function hash(content) {
  return createHash('sha256').update(content).digest('hex');
}

function fetchOpenAPIHash() {
  try {
    const json = execSync(`curl -sf ${OPENAPI_URL}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return hash(json);
  } catch {
    return null;
  }
}

function generateTypes() {
  try {
    console.log('🔄 Regenerating types...');
    execSync(`npx openapi-typescript ${OPENAPI_URL} -o ${GENERATED_FILE} --alphabetize --export-type`, {
      stdio: 'inherit',
    });
    console.log('✅ Types updated successfully\n');
  } catch (err) {
    console.error('❌ Type generation failed:', err?.message || err);
  }
}

(async function main() {
  console.log('👀 Watching OpenAPI schema for changes...');
  console.log(`📍 Endpoint: ${OPENAPI_URL}`);
  console.log(`⏱️  Poll interval: ${POLL_INTERVAL_MS}ms\n`);

  let lastSchemaHash = null;
  let backendAvailable = false;

  // Initial generation
  const initialHash = fetchOpenAPIHash();
  if (initialHash) {
    backendAvailable = true;
    lastSchemaHash = initialHash;
    if (!existsSync(GENERATED_FILE)) {
      console.log('🆕 No existing types found, generating initial types...');
      generateTypes();
    } else {
      console.log('✓ Backend reachable, types exist\n');
    }
  } else {
    console.log('⚠️  Backend not available yet, waiting...\n');
  }

  setInterval(() => {
    const currentHash = fetchOpenAPIHash();

    if (!currentHash) {
      if (backendAvailable) {
        console.log('⚠️  Backend became unavailable');
        backendAvailable = false;
      }
      return;
    }

    if (!backendAvailable) {
      console.log('✓ Backend is now available');
      backendAvailable = true;
      lastSchemaHash = currentHash;
      generateTypes();
      return;
    }

    if (currentHash !== lastSchemaHash) {
      console.log('🔔 Schema change detected!');
      lastSchemaHash = currentHash;
      generateTypes();
    }
  }, POLL_INTERVAL_MS);

  // Keep alive
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping watch...');
    process.exit(0);
  });
})();
