import { afterEach, describe, expect, it, vi } from "vitest";
import { api, setUnauthorizedHandler } from "../../frontend/src/api.js";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); setUnauthorizedHandler(() => {}); });

describe("erros da API no frontend", () => {
  it("falha de rede não apaga a sessão e não repete a ação", async () => {
    const expired = vi.fn();
    setUnauthorizedHandler(expired);
    vi.stubGlobal("localStorage", { getItem: () => "token-de-teste" });
    const fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetch);
    await expect(api.sendMessage(1, "teste")).rejects.toThrow("Verifique sua internet");
    expect(expired).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sessão expirada continua direcionando para o login", async () => {
    const expired = vi.fn();
    setUnauthorizedHandler(expired);
    vi.stubGlobal("localStorage", { getItem: () => "token-de-teste" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Sua sessão expirou." }) }));
    await expect(api.me()).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("interrompe uma requisição sem resposta e orienta conferir o resultado", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")));
    })));
    const result = expect(api.markServiceDone(1)).rejects.toThrow("Confira se a ação foi concluída");
    await vi.advanceTimersByTimeAsync(65000);
    await result;
  });
});
