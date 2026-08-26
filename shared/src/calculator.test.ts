import { describe, it, expect } from 'vitest';
import { calculateSplit, formatPersonList, generateRemainderExplanation } from './calculator';
import { dollarsToCents, centsToDollars, formatCurrency, splitInputSchema } from './validation';

describe('calculateSplit core engine', () => {
  it('1. Even split: $12.00, 0% tip, 3 people -> $4.00 each', () => {
    const result = calculateSplit({
      billCents: 1200,
      tipPercentage: 0,
      peopleCount: 3,
    });

    expect(result.tipCents).toBe(0);
    expect(result.grandTotalCents).toBe(1200);
    expect(result.baseShareCents).toBe(400);
    expect(result.remainderCents).toBe(0);
    expect(result.shares).toHaveLength(3);
    expect(result.shares.map((s) => s.finalShareCents)).toEqual([400, 400, 400]);
    expect(result.verificationTotalCents).toBe(1200);
    expect(result.isVerified).toBe(true);
    expect(result.remainderExplanation).toBe('The total divides evenly. No extra cents need to be assigned.');
  });

  it('2. One-cent remainder: $10.03, 0% tip, 3 people -> $3.35, $3.34, $3.34', () => {
    const result = calculateSplit({
      billCents: 1003,
      tipPercentage: 0,
      peopleCount: 3,
    });

    expect(result.tipCents).toBe(0);
    expect(result.grandTotalCents).toBe(1003);
    expect(result.baseShareCents).toBe(334);
    expect(result.remainderCents).toBe(1);
    expect(result.shares).toHaveLength(3);
    expect(result.shares[0].extraCents).toBe(1);
    expect(result.shares[0].finalShareCents).toBe(335);
    expect(result.shares[1].extraCents).toBe(0);
    expect(result.shares[1].finalShareCents).toBe(334);
    expect(result.shares[2].extraCents).toBe(0);
    expect(result.shares[2].finalShareCents).toBe(334);
    expect(result.verificationTotalCents).toBe(1003);
    expect(result.remainderExplanation).toContain('1 extra cent was assigned to Person 1');
  });

  it('3. Multiple-cent remainder: $10.04, 0% tip, 3 people -> $3.35, $3.35, $3.34', () => {
    const result = calculateSplit({
      billCents: 1004,
      tipPercentage: 0,
      peopleCount: 3,
    });

    expect(result.baseShareCents).toBe(334);
    expect(result.remainderCents).toBe(2);
    expect(result.shares.map((s) => s.finalShareCents)).toEqual([335, 335, 334]);
    expect(result.verificationTotalCents).toBe(1004);
    expect(result.remainderExplanation).toContain('One extra cent was assigned to Persons 1 and 2.');
  });

  it('4. Tip calculation: $10.03, 15% tip, 3 people -> Tip: $1.50, Grand Total: $11.53, Shares: $3.85, $3.84, $3.84', () => {
    const result = calculateSplit({
      billCents: 1003,
      tipPercentage: 15,
      peopleCount: 3,
    });

    expect(result.tipCents).toBe(150); // 1003 * 0.15 = 150.45 -> rounded to 150 cents
    expect(result.grandTotalCents).toBe(1153);
    expect(result.baseShareCents).toBe(384);
    expect(result.remainderCents).toBe(1);
    expect(result.shares.map((s) => s.finalShareCents)).toEqual([385, 384, 384]);
    expect(result.verificationTotalCents).toBe(1153);
  });

  it('5. Zero tip: $50.00, 0% tip, 4 people', () => {
    const result = calculateSplit({
      billCents: 5000,
      tipPercentage: 0,
      peopleCount: 4,
    });

    expect(result.tipCents).toBe(0);
    expect(result.grandTotalCents).toBe(5000);
    expect(result.baseShareCents).toBe(1250);
    expect(result.remainderCents).toBe(0);
    expect(result.shares.map((s) => s.finalShareCents)).toEqual([1250, 1250, 1250, 1250]);
  });

  it('6. One person: entire bill + tip assigned to single person', () => {
    const result = calculateSplit({
      billCents: 2549,
      tipPercentage: 20,
      peopleCount: 1,
    });

    // 2549 * 0.20 = 509.8 -> 510 cents tip
    expect(result.tipCents).toBe(510);
    expect(result.grandTotalCents).toBe(3059);
    expect(result.baseShareCents).toBe(3059);
    expect(result.remainderCents).toBe(0);
    expect(result.shares).toHaveLength(1);
    expect(result.shares[0].finalShareCents).toBe(3059);
  });

  it('7. Fractional-cent tip rounding: 1003 cents * 12.5% = 125.375 -> 125 cents', () => {
    const result = calculateSplit({
      billCents: 1003,
      tipPercentage: 12.5,
      peopleCount: 4,
    });

    expect(result.tipCents).toBe(125);
    expect(result.grandTotalCents).toBe(1128);
    expect(result.baseShareCents).toBe(282);
    expect(result.remainderCents).toBe(0);
    expect(result.verificationTotalCents).toBe(1128);
  });

  it('8. Small amount edge case: $0.01, 0% tip, 2 people', () => {
    const result = calculateSplit({
      billCents: 1,
      tipPercentage: 0,
      peopleCount: 2,
    });

    expect(result.grandTotalCents).toBe(1);
    expect(result.baseShareCents).toBe(0);
    expect(result.remainderCents).toBe(1);
    expect(result.shares[0].finalShareCents).toBe(1);
    expect(result.shares[1].finalShareCents).toBe(0);
    expect(result.verificationTotalCents).toBe(1);
  });

  it('9. Small amount edge case: $1.00, 0% tip, 3 people', () => {
    const result = calculateSplit({
      billCents: 100,
      tipPercentage: 0,
      peopleCount: 3,
    });

    expect(result.grandTotalCents).toBe(100);
    expect(result.baseShareCents).toBe(33);
    expect(result.remainderCents).toBe(1);
    expect(result.shares.map((s) => s.finalShareCents)).toEqual([34, 33, 33]);
    expect(result.verificationTotalCents).toBe(100);
  });

  it('10. Large party size: 100 people splitting $999.99 with 18% tip', () => {
    const result = calculateSplit({
      billCents: 99999,
      tipPercentage: 18,
      peopleCount: 100,
    });

    // 99999 * 0.18 = 17999.82 -> 18000 cents tip
    expect(result.tipCents).toBe(18000);
    expect(result.grandTotalCents).toBe(117999);
    expect(result.shares).toHaveLength(100);
    expect(result.verificationTotalCents).toBe(117999);
    expect(result.isVerified).toBe(true);
  });

  it('11. Input validation throwing errors on invalid inputs', () => {
    expect(() => calculateSplit({ billCents: 0, tipPercentage: 15, peopleCount: 2 })).toThrow(
      'Bill amount must be greater than zero.'
    );
    expect(() => calculateSplit({ billCents: 100, tipPercentage: -5, peopleCount: 2 })).toThrow(
      'Tip percentage cannot be negative.'
    );
    expect(() => calculateSplit({ billCents: 100, tipPercentage: 15, peopleCount: 0 })).toThrow(
      'Number of people must be an integer of at least 1.'
    );
    expect(() => calculateSplit({ billCents: 100, tipPercentage: 15, peopleCount: 2.5 })).toThrow(
      'Number of people must be an integer of at least 1.'
    );
  });

  it('12. Property-Based Fuzzing Test: 1,000 random inputs MUST always satisfy SUM(shares) === grandTotal', () => {
    for (let i = 0; i < 1000; i++) {
      // Random bill from 1 cent to $10,000.00
      const billCents = Math.floor(Math.random() * 1000000) + 1;
      // Random tip from 0% to 100% (with random decimals)
      const tipPercentage = Math.round(Math.random() * 1000) / 10;
      // Random people count from 1 to 200
      const peopleCount = Math.floor(Math.random() * 200) + 1;

      const result = calculateSplit({ billCents, tipPercentage, peopleCount });

      const computedSum = result.shares.reduce((sum, s) => sum + s.finalShareCents, 0);

      expect(computedSum).toBe(result.grandTotalCents);
      expect(result.verificationTotalCents).toBe(result.grandTotalCents);
      expect(result.isVerified).toBe(true);
      expect(result.shares.length).toBe(peopleCount);
    }
  });

  it('13. Helpers test: dollarsToCents, centsToDollars, formatCurrency, formatPersonList', () => {
    expect(dollarsToCents('10.03')).toBe(1003);
    expect(dollarsToCents(10.03)).toBe(1003);
    expect(centsToDollars(1003)).toBe('10.03');
    expect(formatCurrency(1003)).toBe('$10.03');
    expect(formatPersonList(1)).toBe('Person 1');
    expect(formatPersonList(2)).toBe('Persons 1 and 2');
    expect(formatPersonList(3)).toBe('Persons 1, 2, and 3');
  });

  it('14. Zod Schema Validation', () => {
    const valid = splitInputSchema.parse({
      billAmount: '10.03',
      tipPercentage: 15,
      peopleCount: 3,
    });
    expect(valid.billAmount).toBe(10.03);
    expect(valid.tipPercentage).toBe(15);
    expect(valid.peopleCount).toBe(3);

    // Reject > 2 decimal places in currency
    expect(() =>
      splitInputSchema.parse({
        billAmount: '10.005',
        tipPercentage: 15,
        peopleCount: 3,
      })
    ).toThrow();

    // Reject non-integer people
    expect(() =>
      splitInputSchema.parse({
        billAmount: 10,
        tipPercentage: 15,
        peopleCount: 2.5,
      })
    ).toThrow();
  });
});
