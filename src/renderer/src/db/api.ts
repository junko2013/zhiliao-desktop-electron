import { drizzle } from 'drizzle-orm/sqlite-proxy';
// import * as schema from './schema';
//导入schema
import * as schema from '@shared/db/schema';

export const database = drizzle(async (...args) => {
  try {
    const result = await window.api.execute(...args);
    return { rows: Array.isArray(result) ? result : [] };
  } catch (e: any) {
    console.error('Error from sqlite proxy server: ', e);
    return { rows: [] };
  }
}, {
  schema: schema
});
