# ClaimToken Table Migration

The `ClaimToken` table needs to be created in your database. Here are two ways to do it:

## Option 1: Using Prisma (Recommended)

If you have `DATABASE_URL` set in your `.env.local` or `.env` file, run:

```bash
npx prisma db push
```

Or create a migration:

```bash
npx prisma migrate dev --name add_claim_token_table
```

## Option 2: Run SQL Manually

If Prisma commands don't work, you can run the SQL script directly in your database:

1. Connect to your PostgreSQL database
2. Run the SQL from `prisma/migrations/create_claim_token_table.sql`

Or use psql:

```bash
psql $DATABASE_URL -f prisma/migrations/create_claim_token_table.sql
```

## Option 3: Using Database GUI

1. Open your database management tool (pgAdmin, DBeaver, TablePlus, etc.)
2. Connect to your database
3. Run the SQL from `prisma/migrations/create_claim_token_table.sql`

## Verify

After running the migration, verify the table exists:

```sql
SELECT * FROM "ClaimToken" LIMIT 1;
```

If you see no errors, the table was created successfully!

