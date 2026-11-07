#!/usr/bin/env bash
# Run from an isolated checkout against a fresh localhost PostgreSQL database
# named barhoum_phase5_*. Before integration, set COURSE_COMMERCE_TEST_SCHEMA
# to the coordinator's disposable schema SQL.
set -euo pipefail
export PAYLOAD_SECRET=phase5-local-test-not-for-production
export NEXT_TELEMETRY_DISABLED=1
node --input-type=module <<'NODE'
import assert from "node:assert/strict";
assert.equal(process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED);
const db = new URL(process.env.DATABASE_URL);
assert.equal(db.hostname, "127.0.0.1");
assert.match(db.pathname, /^\/barhoum_phase5_[a-z0-9_]+$/);
assert.ok(!process.env.VERCEL);
NODE

temp=$(mktemp -d)
server_pid=""
trap 'if [ -n "$server_pid" ]; then kill "$server_pid" 2>/dev/null || true; fi; rm -rf -- "$temp"' EXIT

export COURSE_COMMERCE_ENABLED=true COURSE_STRIPE_LIVEMODE=false
export COURSE_STRIPE_SECRET_KEY=sk_test_commerce_fixture COURSE_STRIPE_ACCOUNT_ID=acct_Fixture
export COURSE_STRIPE_WEBHOOK_SECRET=whsec_course_fixture STRIPE_WEBHOOK_SECRET=whsec_legacy_fixture
export STRIPE_SECRET_KEY=sk_test_legacy_fixture ENABLE_STRIPE=true
export GA4_MEASUREMENT_ID=G-FIXTURE GA4_API_SECRET=analytics-fixture-secret
export GOOGLE_SCRIPT_URL=https://training-sheet.fixture.invalid GOOGLE_SCRIPT_SECRET=legacy-fixture-secret
export COURSE_COMMERCE_ORIGIN="http://127.0.0.1:${COURSE_COMMERCE_TEST_PORT:-4389}"
export STUDENT_AUTH_ORIGIN="$COURSE_COMMERCE_ORIGIN"
export COURSE_COMMERCE_TEST_STATE="$temp/stripe.json"
cat > "$COURSE_COMMERCE_TEST_STATE" <<'JSON'
{"prices":{"price_FixtureBase":4900,"price_FixturePremium":1900,"price_FixtureNew":5900},"requests":{},"sessions":{},"intents":{},"charges":{},"refunds":{},"disputes":{},"legacyLeads":[],"legacyAnalytics":[],"failCreates":0}
JSON

PAYLOAD_MIGRATING=1 node node_modules/payload/bin.js --disable-transpile migrate
node --input-type=module <<'NODE'
import { readFile } from "node:fs/promises";
import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await client.connect();
try {
    const result = await client.query("SELECT to_regclass('course_orders') AS table_name");
    if (!result.rows[0].table_name) {
        if (!process.env.COURSE_COMMERCE_TEST_SCHEMA) throw new Error("Set COURSE_COMMERCE_TEST_SCHEMA to the disposable SQL schema.");
        await client.query(await readFile(process.env.COURSE_COMMERCE_TEST_SCHEMA, "utf8"));
    }
} finally {
    await client.end();
}
NODE

npm run build
NODE_OPTIONS="--import=\"$PWD/tests/course-commerce/stripe-fixture.mjs\"" node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port "${COURSE_COMMERCE_TEST_PORT:-4389}" >"$temp/server.log" 2>&1 &
server_pid=$!
for attempt in {1..25}; do
    if curl -fsS --max-time 1 "$COURSE_COMMERCE_ORIGIN/robots.txt" >/dev/null 2>&1; then break; fi
    if ! kill -0 "$server_pid" 2>/dev/null; then echo "The isolated test server failed to start." >&2; exit 1; fi
    sleep 0.25
done
node tests/course-commerce/integration.mjs
