import { defineConfig } from "prisma/config";

// prisma.config.ts salta la carga automática del .env — lo cargamos explícitamente
// para que DATABASE_URL esté disponible durante la validación del schema en el build.
import "dotenv/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  seed: "ts-node prisma/seed.ts",
});
