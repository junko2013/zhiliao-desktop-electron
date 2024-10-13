import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './src/drizzle',
  schema: './src/shared/db/schema/index.ts',
  dialect: 'sqlite',
});