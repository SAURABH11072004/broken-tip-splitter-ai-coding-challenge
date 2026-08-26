import { SplitCalculationInput, SplitCalculationResult, SplitShare } from './types';

/**
 * Formats a list of person numbers into natural English (e.g., "Persons 1, 2, and 3" or "Person 1").
 */
export function formatPersonList(count: number): string {
  if (count <= 0) return '';
  if (count === 1) return 'Person 1';
  if (count === 2) return 'Persons 1 and 2';
  const personNumbers = Array.from({ length: count }, (_, i) => i + 1);
  const leading = personNumbers.slice(0, -1).join(', ');
  const last = personNumbers[personNumbers.length - 1];
  return `Persons ${leading}, and ${last}`;
}

/**
 * Generates an explicit, user-friendly explanation of how remainder cents are assigned.
 */
export function generateRemainderExplanation(remainderCents: number): string {
  if (remainderCents === 0) {
    return 'The total divides evenly. No extra cents need to be assigned.';
  }
  if (remainderCents === 1) {
    return '1 extra cent was assigned to Person 1 so that all individual shares sum exactly to the grand total.';
  }
  const personList = formatPersonList(remainderCents);
  return `The total leaves ${remainderCents} cents after equal division. One extra cent was assigned to ${personList}.`;
}

/**
 * Pure calculation function for splitting bills with integer-cent accuracy.
 *
 * Guaranteed Invariant:
 * SUM(shares.finalShareCents) === grandTotalCents
 */
export function calculateSplit(input: SplitCalculationInput): SplitCalculationResult {
  const { billCents, tipPercentage, peopleCount } = input;

  if (billCents <= 0) {
    throw new Error('Bill amount must be greater than zero.');
  }
  if (tipPercentage < 0) {
    throw new Error('Tip percentage cannot be negative.');
  }
  if (peopleCount < 1 || !Number.isInteger(peopleCount)) {
    throw new Error('Number of people must be an integer of at least 1.');
  }

  // 1. Calculate tip once in integer cents, rounding to nearest cent
  const tipCents = Math.round((billCents * tipPercentage) / 100);

  // 2. Grand total in cents
  const grandTotalCents = billCents + tipCents;

  // 3. Base share per person via integer division
  const baseShareCents = Math.floor(grandTotalCents / peopleCount);

  // 4. Remainder cents
  const remainderCents = grandTotalCents % peopleCount;

  // 5. Fair remainder distribution: the first `remainderCents` people receive 1 extra cent
  const shares: SplitShare[] = [];
  for (let i = 1; i <= peopleCount; i++) {
    const extraCents = i <= remainderCents ? 1 : 0;
    const finalShareCents = baseShareCents + extraCents;
    shares.push({
      personNumber: i,
      baseShareCents,
      extraCents,
      finalShareCents,
    });
  }

  // 6. Invariant verification
  const verificationTotalCents = shares.reduce(
    (sum, share) => sum + share.finalShareCents,
    0
  );

  if (verificationTotalCents !== grandTotalCents) {
    throw new Error(
      `Mathematical invariant violated: sum of shares (${verificationTotalCents}¢) does not match grand total (${grandTotalCents}¢)`
    );
  }

  const remainderExplanation = generateRemainderExplanation(remainderCents);

  return {
    billCents,
    tipPercentage,
    tipCents,
    grandTotalCents,
    peopleCount,
    baseShareCents,
    remainderCents,
    shares,
    verificationTotalCents,
    isVerified: true,
    remainderExplanation,
  };
}
