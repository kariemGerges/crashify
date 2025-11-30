# Database Migrations

This directory contains SQL migration files for the Crashify database schema.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content
4. Run them in order (001, 002, 003, etc.)

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Direct SQL Connection

```bash
# Using psql
psql $DATABASE_URL -f supabase/migrations/001_add_assessment_fields.sql
psql $DATABASE_URL -f supabase/migrations/002_create_email_logs_table.sql
# ... etc
```

## Migration Order

Run migrations in this order:

1. `001_add_assessment_fields.sql` - Adds fields to existing assessments table
2. `002_create_email_logs_table.sql` - Creates email logging table
3. `003_create_quote_requests_table.sql` - Creates quote request system
4. `004_create_secure_form_links_table.sql` - Creates secure form links
5. `005_create_repairers_table.sql` - Creates repairers directory (optional)
6. `006_create_clients_table.sql` - Creates clients directory (optional)

## Verification

After running migrations, verify tables exist:

```sql
-- Check assessments table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN ('entered_iq_at', 'source', 'email_id', 'payment_id');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_logs', 'quote_requests', 'secure_form_links', 'repairers', 'clients');
```

## Rollback

If you need to rollback a migration, create a reverse migration file. For example:

```sql
-- Rollback 001
ALTER TABLE assessments
DROP COLUMN IF EXISTS entered_iq_at,
DROP COLUMN IF EXISTS entered_by,
DROP COLUMN IF EXISTS iq_controls_reference,
DROP COLUMN IF EXISTS source,
DROP COLUMN IF EXISTS email_id,
DROP COLUMN IF EXISTS payment_id,
DROP COLUMN IF EXISTS completed_at;
```

## Notes

- All migrations use `IF NOT EXISTS` and `IF EXISTS` to be idempotent
- Timestamps use `TIMESTAMPTZ` for timezone-aware dates
- UUIDs are used for primary keys
- JSONB is used for flexible metadata storage
- Foreign keys use `ON DELETE SET NULL` or `ON DELETE CASCADE` appropriately

