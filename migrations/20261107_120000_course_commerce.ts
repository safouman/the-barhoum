import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        CREATE TABLE course_offers (
          id serial PRIMARY KEY,
          course_id integer NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
          module_id integer REFERENCES modules(id) ON DELETE RESTRICT,
          enabled boolean NOT NULL DEFAULT false,
          stripe_price_id varchar NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now(),
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX course_offers_base_unique ON course_offers(course_id) WHERE module_id IS NULL;
        CREATE UNIQUE INDEX course_offers_module_unique ON course_offers(module_id) WHERE module_id IS NOT NULL;
        CREATE TABLE course_orders (
          id uuid PRIMARY KEY,
          student_id integer NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
          offer_id integer NOT NULL REFERENCES course_offers(id) ON DELETE RESTRICT,
          course_id integer NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
          module_id integer REFERENCES modules(id) ON DELETE RESTRICT,
          stripe_account text NOT NULL,
          livemode boolean NOT NULL,
          stripe_price_id text NOT NULL,
          amount_minor integer NOT NULL CHECK (amount_minor > 0),
          currency text NOT NULL,
          tax_minor integer,
          total_minor integer,
          stripe_session_id text,
          stripe_payment_intent_id text,
          checkout_url text,
          checkout_origin text NOT NULL,
          cancel_course_slug text NOT NULL,
          expires_at timestamptz,
          status text NOT NULL CHECK (status IN ('creating','open','processing','fulfilled','failed','expired','support_required')),
          reason text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE(stripe_account, livemode, stripe_session_id),
          UNIQUE(stripe_account, livemode, stripe_payment_intent_id)
        );
        CREATE UNIQUE INDEX course_orders_base_pending ON course_orders(student_id, course_id) WHERE module_id IS NULL AND status IN ('creating','open','processing');
        CREATE UNIQUE INDEX course_orders_module_pending ON course_orders(student_id, course_id, module_id) WHERE module_id IS NOT NULL AND status IN ('creating','open','processing');
        CREATE TABLE course_payment_events (
          stripe_account text NOT NULL,
          livemode boolean NOT NULL,
          stripe_event_id text NOT NULL,
          event_type text NOT NULL,
          order_id uuid NOT NULL REFERENCES course_orders(id) ON DELETE RESTRICT,
          outcome text NOT NULL,
          provider_reference text,
          amount_minor integer,
          processed_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY(stripe_account, livemode, stripe_event_id)
        );
        CREATE TABLE course_entitlements (
          id serial PRIMARY KEY,
          student_id integer NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
          course_id integer NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
          module_id integer REFERENCES modules(id) ON DELETE RESTRICT,
          source_order_id uuid NOT NULL UNIQUE REFERENCES course_orders(id) ON DELETE RESTRICT,
          status text NOT NULL CHECK (status IN ('active','suspended','revoked')),
          reason text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX course_entitlements_base_active ON course_entitlements(student_id, course_id) WHERE module_id IS NULL AND status='active';
        CREATE UNIQUE INDEX course_entitlements_module_active ON course_entitlements(student_id, course_id, module_id) WHERE module_id IS NOT NULL AND status='active';
        CREATE INDEX course_orders_content_idx ON course_orders(course_id,module_id);
        CREATE INDEX course_payment_events_order_idx ON course_payment_events(order_id);
        CREATE INDEX course_offers_course_idx ON course_offers(course_id);
        CREATE INDEX course_offers_module_idx ON course_offers(module_id);
        CREATE INDEX course_offers_created_at_idx ON course_offers(created_at);
        CREATE INDEX course_offers_updated_at_idx ON course_offers(updated_at);
        ALTER TABLE payload_locked_documents_rels ADD COLUMN course_offers_id integer REFERENCES course_offers(id) ON DELETE CASCADE;
        CREATE INDEX payload_locked_documents_rels_course_offers_idx ON payload_locked_documents_rels(course_offers_id);
        ALTER TABLE payload_preferences_rels ADD COLUMN course_offers_id integer REFERENCES course_offers(id) ON DELETE CASCADE;
        CREATE INDEX payload_preferences_rels_course_offers_idx ON payload_preferences_rels(course_offers_id);
    `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE payload_preferences_rels DROP COLUMN course_offers_id;
        ALTER TABLE payload_locked_documents_rels DROP COLUMN course_offers_id;
        DROP TABLE course_entitlements;
        DROP TABLE course_payment_events;
        DROP TABLE course_orders;
        DROP TABLE course_offers;
    `);
}
