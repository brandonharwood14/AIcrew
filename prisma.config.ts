// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  //engine: "classic", error on this line due to missing object literal  and this came up with ai maybe its onto something missing"prisma/engines" folder, but it works without it
  datasource: {
    url: env("DATABASE_URL"),
  },
});
