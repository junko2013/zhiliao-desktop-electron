import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './drizzle',
  schema: './src/shared/db/schema/index.ts',
  dialect: 'sqlite',
});