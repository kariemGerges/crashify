import { defineConfig } from "prisma/config";

// Use dummy URL during generation if DATABASE_URL is not set
// This is only needed for the config file - the actual connection uses schema.prisma
const databaseUrl = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
