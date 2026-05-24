import { initDB } from "./db";

let initialized = false;

export async function ensureDB() {
  if (!initialized) {
    await initDB();
    initialized = true;
  }
}
