import { describe, expect, it } from "vitest";
import { normalizeChileanPhone, isValidChileanPhone } from "./phone-cl";

describe("normalizeChileanPhone", () => {
  it("normaliza un móvil de 9 dígitos", () => {
    expect(normalizeChileanPhone("987654321")).toBe("+56987654321");
  });
  it("normaliza con código país y separadores", () => {
    expect(normalizeChileanPhone("+56 9 8765 4321")).toBe("+56987654321");
  });
  it("normaliza 8 dígitos asumiendo móvil", () => {
    expect(normalizeChileanPhone("87654321")).toBe("+56987654321");
  });
  it("devuelve null para entrada inválida", () => {
    expect(normalizeChileanPhone("")).toBeNull();
    expect(normalizeChileanPhone(null)).toBeNull();
  });
  it("isValidChileanPhone refleja la normalización", () => {
    expect(isValidChileanPhone("987654321")).toBe(true);
    expect(isValidChileanPhone("abc")).toBe(false);
  });
});
