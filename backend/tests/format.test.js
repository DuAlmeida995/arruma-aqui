import { describe, it, expect } from "vitest";
import { chatTime, shortDate } from "../services/format.js";

// O servidor de produção roda em UTC; datas e horas mostradas são as de São Paulo (UTC-3).
describe("datas no fuso de São Paulo", () => {
  const now = new Date("2026-11-06T00:30:00Z"); // 21:30 de 05/11 em SP

  it("hora de hoje em SP, não em UTC", () => {
    expect(chatTime("2026-11-06T00:06:00Z", now)).toBe("21:06");
  });

  it("'Ontem' segue o calendário de SP", () => {
    expect(chatTime("2026-11-05T01:00:00Z", now)).toBe("Ontem"); // 22:00 de 04/11 em SP
  });

  it("dia da semana e data curta em SP", () => {
    expect(chatTime("2026-11-02T12:00:00Z", now)).toBe("Seg");
    expect(shortDate("2026-10-01T02:00:00Z")).toBe("30 set"); // 23:00 de 30/09 em SP
  });
});
