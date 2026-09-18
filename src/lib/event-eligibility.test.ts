import { describe, it, expect } from 'vitest';
import { computeEligibility, eligibilityMessage, seatsLabel } from './event-eligibility';

describe('computeEligibility', () => {
  it('is ok with no restrictions and no cap', () => {
    const result = computeEligibility({}, { userType: 'INDIVIDUAL' });
    expect(result.ok).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.seatsLeft).toBeNull();
    expect(result.isFull).toBe(false);
  });

  it('computes remaining overall seats and full state', () => {
    const result = computeEligibility({ maxAttendees: 10, currentAttendees: 7 }, null);
    expect(result.seatsLeft).toBe(3);
    expect(result.isFull).toBe(false);
  });

  it('treats currentAttendees at or above max as full', () => {
    const result = computeEligibility({ maxAttendees: 10, currentAttendees: 10 }, null);
    expect(result.seatsLeft).toBe(0);
    expect(result.isFull).toBe(true);
  });

  it('never returns negative seatsLeft when overbooked', () => {
    const result = computeEligibility({ maxAttendees: 5, currentAttendees: 9 }, null);
    expect(result.seatsLeft).toBe(0);
    expect(result.isFull).toBe(true);
  });

  it('treats maxAttendees of 0 as uncapped', () => {
    const result = computeEligibility({ maxAttendees: 0, currentAttendees: 5 }, null);
    expect(result.seatsLeft).toBeNull();
    expect(result.isFull).toBe(false);
  });

  it('blocks a viewer whose userType is not in targetUserTypes', () => {
    const result = computeEligibility(
      { targetUserTypes: ['BUSINESS'] },
      { userType: 'INDIVIDUAL' },
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('USER_TYPE');
  });

  it('blocks a viewer with no userType when targetUserTypes is set', () => {
    const result = computeEligibility({ targetUserTypes: ['BUSINESS'] }, {});
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('USER_TYPE');
  });

  it('allows a viewer whose userType matches targetUserTypes', () => {
    const result = computeEligibility(
      { targetUserTypes: ['BUSINESS', 'INDIVIDUAL'] },
      { userType: 'INDIVIDUAL' },
    );
    expect(result.ok).toBe(true);
  });

  it('blocks a viewer whose category is not in targetCategoryIds', () => {
    const result = computeEligibility(
      { targetCategoryIds: ['cat-1'] },
      { categoryId: 'cat-2' },
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('CATEGORY');
  });

  it('checks userType before category when both restrictions fail', () => {
    const result = computeEligibility(
      { targetUserTypes: ['BUSINESS'], targetCategoryIds: ['cat-1'] },
      { userType: 'INDIVIDUAL', categoryId: 'cat-2' },
    );
    expect(result.reason).toBe('USER_TYPE');
  });

  it('computes per-category seats left for a matching viewer', () => {
    const result = computeEligibility(
      {
        categoryLimits: [{ categoryId: 'cat-1', categoryName: 'Doctors', limit: 5 }],
      },
      { categoryId: 'cat-1' },
      3,
    );
    expect(result.categorySeatsLeft).toBe(2);
    expect(result.categoryName).toBe('Doctors');
    expect(result.ok).toBe(true);
  });

  it('blocks with CATEGORY_FULL once the per-category quota is exhausted', () => {
    const result = computeEligibility(
      {
        categoryLimits: [{ categoryId: 'cat-1', categoryName: 'Doctors', limit: 5 }],
      },
      { categoryId: 'cat-1' },
      5,
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('CATEGORY_FULL');
    expect(result.categorySeatsLeft).toBe(0);
  });

  it('does not apply a category limit for a viewer without a matching entry', () => {
    const result = computeEligibility(
      {
        categoryLimits: [{ categoryId: 'cat-1', categoryName: 'Doctors', limit: 5 }],
      },
      { categoryId: 'cat-2' },
    );
    expect(result.categorySeatsLeft).toBeNull();
    expect(result.categoryName).toBeNull();
    expect(result.ok).toBe(true);
  });

  it('treats a null viewer as having no userType or category', () => {
    const result = computeEligibility({ targetUserTypes: ['BUSINESS'] }, null);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('USER_TYPE');
  });

  it('attaches a human-readable message when ineligible', () => {
    const result = computeEligibility({ targetUserTypes: ['BUSINESS'] }, null);
    expect(result.message).toBe('This event is open to selected account types only.');
  });

  it('has a null message when eligible', () => {
    const result = computeEligibility({}, null);
    expect(result.message).toBeNull();
  });
});

describe('eligibilityMessage', () => {
  it('returns null for a null reason', () => {
    expect(eligibilityMessage(null)).toBeNull();
  });

  it('returns the USER_TYPE message', () => {
    expect(eligibilityMessage('USER_TYPE')).toBe('This event is open to selected account types only.');
  });

  it('returns the CATEGORY message', () => {
    expect(eligibilityMessage('CATEGORY')).toBe('This event is reserved for selected professions.');
  });

  it('returns a category-specific CATEGORY_FULL message when a name is given', () => {
    expect(eligibilityMessage('CATEGORY_FULL', 'Doctors')).toBe('All Doctors seats for this event are taken.');
  });

  it('returns a generic CATEGORY_FULL message when no name is given', () => {
    expect(eligibilityMessage('CATEGORY_FULL', null)).toBe('Seats for your profession are full for this event.');
  });
});

describe('seatsLabel', () => {
  it('returns null for an uncapped event', () => {
    expect(seatsLabel(null)).toBeNull();
    expect(seatsLabel(undefined)).toBeNull();
  });

  it('returns "Fully booked" when no seats remain', () => {
    expect(seatsLabel(0)).toBe('Fully booked');
    expect(seatsLabel(-1)).toBe('Fully booked');
  });

  it('uses singular wording for exactly one seat', () => {
    expect(seatsLabel(1)).toBe('Only 1 seat left');
  });

  it('uses the low-availability wording at the 5-seat boundary', () => {
    expect(seatsLabel(5)).toBe('Only 5 seats left');
  });

  it('uses the plain wording above 5 seats', () => {
    expect(seatsLabel(6)).toBe('6 seats left');
  });
});
