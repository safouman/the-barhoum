#!/usr/bin/env bash
# Run from an isolated checkout. Supply a fresh localhost PostgreSQL database
# with a name starting barhoum_phase4_, and DATABASE_URL + DATABASE_URL_UNPOOLED.
# To also run Phase 7 navigation checks, set STUDENT_TEST_NAVIGATION=1 and
# provide Playwright via PLAYWRIGHT_MODULE (and BROWSER_CHANNEL if needed).
set -euo pipefail

node --input-type=module <<'NODE'
import assert from "node:assert/strict";
for (const key of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
    const db = new URL(process.env[key]);
    assert.equal(db.hostname, "127.0.0.1");
    assert.match(db.pathname, /^\/barhoum_phase4_[a-z0-9_]+$/);
}
assert.equal(process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED);
assert.ok(!process.env.VERCEL);
NODE

test_dir=$(mktemp -d)
server_pid=""
export STUDENT_TEST_FILE="phase4-fixture-${RANDOM}-${RANDOM}.pdf"
trap 'if [ -n "$server_pid" ]; then kill "$server_pid" 2>/dev/null || true; fi; rm -f -- "uploads/lesson-files/$STUDENT_TEST_FILE"; rm -rf -- "$test_dir"' EXIT

export PAYLOAD_SECRET=phase4-local-fixture-no-production-use
export STUDENT_AUTH_ORIGIN="http://127.0.0.1:${STUDENT_TEST_PORT:-4398}"
export STUDENT_TEST_MAILBOX="$test_dir/mailbox"
export GOOGLE_CLIENT_ID=phase4-test-client GOOGLE_CLIENT_SECRET=phase4-test-secret
export RESEND_API_KEY=fixture-key STUDENT_AUTH_FROM_EMAIL=fixture@example.invalid
export STUDENT_AUTH_EMAIL_ALLOWLIST=student-fixture@example.invalid,student-new@example.invalid,google-fixture@gmail.com,third-party@example.invalid,expired-fixture@example.invalid,race-fixture@example.invalid,second-race-fixture@example.invalid
export NEXT_TELEMETRY_DISABLED=1

PAYLOAD_MIGRATING=1 node node_modules/payload/bin.js --disable-transpile migrate
if [ "${STUDENT_TEST_MIGRATION_ROLLBACK:-0}" = 1 ]; then
    PAYLOAD_MIGRATING=1 node node_modules/payload/bin.js --disable-transpile migrate:down
    PAYLOAD_MIGRATING=1 node node_modules/payload/bin.js --disable-transpile migrate
    PAYLOAD_MIGRATING=1 node node_modules/payload/bin.js --disable-transpile migrate
fi
if [ "${STUDENT_TEST_NAVIGATION:-0}" = 1 ]; then
    export NEXT_PUBLIC_LOCALIZATION_ENABLED_LOCALES=true
fi
npm run build

NODE_OPTIONS="--import=\"$PWD/tests/student-auth/provider-fixture.mjs\"" node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port "${STUDENT_TEST_PORT:-4398}" >"$test_dir/server.log" 2>&1 &
server_pid=$!
for attempt in {1..25}; do
    if curl -fsS --max-time 1 "$STUDENT_AUTH_ORIGIN/robots.txt" >/dev/null 2>&1; then break; fi
    if ! kill -0 "$server_pid" 2>/dev/null; then echo "The isolated test server failed to start." >&2; exit 1; fi
    sleep 0.25
done
STUDENT_TEST_SERVER_LOG="$test_dir/server.log" node tests/student-auth/integration.mjs

if [ "${STUDENT_TEST_NAVIGATION:-0}" = 1 ]; then
    node tests/phase7-navigation.browser.mjs
fi
