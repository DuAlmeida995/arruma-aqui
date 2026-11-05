import { defineConfig } from "vitest/config";

// Testes de integração falam com o Supabase (us-east-1): várias idas e voltas por teste.
export default defineConfig({
  test: { testTimeout: 20000, hookTimeout: 20000 },
});
