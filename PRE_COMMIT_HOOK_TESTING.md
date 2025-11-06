# Pre-commit Hook Testing

## Testing the Pre-commit Hook

The pre-commit hook automatically syncs TypeScript types before each commit.

### Test 1: Hook runs on commit
```bash
cd /home/ubuntu/openai-realtime-agents
echo "# test" >> README.md
git add README.md
git commit -m "test: verify hook runs"
```

Expected output:
```
🔍 Pre-commit: Checking for API type updates...
🔄 Backend available, regenerating types...
✓ Types are up to date
```

### Test 2: Hook adds type changes automatically
1. Make a change to backend schema
2. Commit any file
3. The hook will:
   - Detect backend is available
   - Regenerate types
   - Auto-add `src/types/api.generated.ts` if changed
   - Include it in your commit

### Test 3: Hook handles backend unavailable gracefully
1. Stop the backend
2. Make a commit
3. Expected output:
```
🔍 Pre-commit: Checking for API type updates...
⚠️  Backend not available, skipping type generation
```
Commit proceeds normally without error.

## How It Works

1. **Pre-commit trigger**: Git runs `.husky/pre-commit` before each commit
2. **Backend check**: Script checks if `http://localhost:8000/openapi.json` is accessible
3. **Type generation**: If backend is available, runs `npm run generate:types`
4. **Auto-staging**: If types changed, automatically adds them to the commit
5. **Non-blocking**: If backend unavailable or generation fails, commit still proceeds

## Files

- `.husky/pre-commit` - Git hook entry point
- `scripts/pre-commit-types.mjs` - Hook logic
- `package.json` - Contains `prepare` script to install hooks on `npm install`
