import { defineConfig } from "vitest/config";

// Testes de integração falam com o Supabase (us-east-1): várias idas e voltas por teste.
export default defineConfig({
  test: {
    testTimeout: 20000,
    hookTimeout: 20000,
    // um arquivo por vez: todos usam o mesmo banco no Supabase e o pooler gratuito tem poucas conexões
    fileParallelism: false,
    coverage: {
      provider: "v8",
      // "regras de negócio" (doc FAPESP, Atividade 7): serviços, rotas, repositórios e middlewares
      include: ["services/**", "routes/**", "repositories/**", "middleware/**"],
      reporter: ["text-summary", "text"],
      // a meta do doc é 70%; o build falha se cair abaixo disso
      thresholds: { lines: 70, statements: 70, functions: 70, branches: 70 },
    },
  },
});
