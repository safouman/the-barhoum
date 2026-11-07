import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE course_orders
            ADD COLUMN ops_next_check_at timestamptz NOT NULL DEFAULT now(),
            ADD COLUMN ops_lease_until timestamptz,
            ADD COLUMN ops_lease_token uuid,
            ADD COLUMN ops_failures integer NOT NULL DEFAULT 0 CHECK (ops_failures >= 0),
            ADD COLUMN ops_session_cursor text;
        CREATE INDEX course_orders_ops_due_idx
            ON course_orders (stripe_account, livemode, ops_next_check_at, id);
    `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DROP INDEX course_orders_ops_due_idx;
        ALTER TABLE course_orders
            DROP COLUMN ops_session_cursor,
            DROP COLUMN ops_failures,
            DROP COLUMN ops_lease_token,
            DROP COLUMN ops_lease_until,
            DROP COLUMN ops_next_check_at;
    `);
}
