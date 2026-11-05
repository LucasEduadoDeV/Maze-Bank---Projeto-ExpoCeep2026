import { afterEach, describe, expect, it, vi } from "vitest";
import { generate16DigitCardNumber } from "../utils/generateCard";
import { generateCvv } from "../utils/generateCvvCard";
import { generateLimitCard } from "../utils/generateLimitCard";
import { generateValidateCard } from "../utils/generateValidateCard";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("card utility functions", () => {
  it("generates a 16-digit card number", () => {
    expect(generate16DigitCardNumber()).toMatch(/^\d{16}$/);
  });

  it("generates the minimum three-digit CVV", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(generateCvv()).toBe("100");
  });

  it("generates the maximum three-digit CVV", () => {
    vi.spyOn(Math, "random").mockReturnValue(1 - Number.EPSILON);

    expect(generateCvv()).toBe("999");
  });

  it("sets the card limit to 30 percent of monthly income", () => {
    expect(generateLimitCard(5000)).toBe(1500);
  });

  it("returns a zero card limit for zero income", () => {
    expect(generateLimitCard(0)).toBe(0);
  });

  it("sets the card expiration date five years ahead", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:30:00.000Z"));

    expect(generateValidateCard()).toEqual(new Date("2031-06-15T12:30:00.000Z"));
  });
});
