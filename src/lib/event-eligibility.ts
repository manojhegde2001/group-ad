/**
 * Shared, pure helpers for event capacity + per-profession quota + eligibility.
 *
 * The authoritative enrollment write still lives in
 * `POST /api/events/[id]/enroll` — this module mirrors the same rules so the
 * UI can tell a user up front what will happen, and the read APIs can expose
 * consistent numbers. Keep the two in sync.
 */

export type EligibilityReason = 'USER_TYPE' | 'CATEGORY' | 'CATEGORY_FULL' | null;

export interface EventEligibilityInput {
    targetUserTypes?: string[] | null;
    targetCategoryIds?: string[] | null;
    categoryLimits?: { categoryId: string; categoryName: string; limit: number }[] | null;
    maxAttendees?: number | null;
    currentAttendees?: number | null;
}

export interface EligibilityViewer {
    userType?: string | null;
    categoryId?: string | null;
}

export interface Eligibility {
    /** Remaining overall seats. `null` = uncapped event. */
    seatsLeft: number | null;
    /** Overall capacity reached (waitlist territory, not "ineligible"). */
    isFull: boolean;
    /** Can this viewer enroll right now (ignoring "already enrolled")? */
    ok: boolean;
    reason: EligibilityReason;
    /** Remaining seats for the viewer's profession, if a per-category limit applies. */
    categorySeatsLeft: number | null;
    categoryName: string | null;
    /** Human-readable explanation when `ok` is false, else `null`. */
    message: string | null;
}

export function computeEligibility(
    event: EventEligibilityInput,
    viewer: EligibilityViewer | null | undefined,
    viewerCategoryEnrolledCount = 0,
): Eligibility {
    const max = event.maxAttendees ?? null;
    const current = event.currentAttendees ?? 0;
    const seatsLeft = max != null && max > 0 ? Math.max(0, max - current) : null;
    const isFull = seatsLeft != null && seatsLeft <= 0;

    let categorySeatsLeft: number | null = null;
    let categoryName: string | null = null;
    const limits = event.categoryLimits ?? [];
    if (viewer?.categoryId && limits.length > 0) {
        const entry = limits.find((l) => l.categoryId === viewer.categoryId);
        if (entry) {
            categoryName = entry.categoryName;
            categorySeatsLeft = Math.max(0, entry.limit - viewerCategoryEnrolledCount);
        }
    }

    let ok = true;
    let reason: EligibilityReason = null;

    if (event.targetUserTypes && event.targetUserTypes.length > 0) {
        if (!viewer?.userType || !event.targetUserTypes.includes(viewer.userType)) {
            ok = false;
            reason = 'USER_TYPE';
        }
    }
    if (ok && event.targetCategoryIds && event.targetCategoryIds.length > 0) {
        if (!viewer?.categoryId || !event.targetCategoryIds.includes(viewer.categoryId)) {
            ok = false;
            reason = 'CATEGORY';
        }
    }
    if (ok && categorySeatsLeft != null && categorySeatsLeft <= 0) {
        ok = false;
        reason = 'CATEGORY_FULL';
    }

    return {
        seatsLeft,
        isFull,
        ok,
        reason,
        categorySeatsLeft,
        categoryName,
        message: eligibilityMessage(reason, categoryName),
    };
}

export function eligibilityMessage(reason: EligibilityReason, categoryName?: string | null): string | null {
    switch (reason) {
        case 'USER_TYPE':
            return 'This event is open to selected account types only.';
        case 'CATEGORY':
            return 'This event is reserved for selected professions.';
        case 'CATEGORY_FULL':
            return categoryName
                ? `All ${categoryName} seats for this event are taken.`
                : "Seats for your profession are full for this event.";
        default:
            return null;
    }
}

/** Short availability label for cards / sidebars. `null` → render nothing. */
export function seatsLabel(seatsLeft: number | null | undefined): string | null {
    if (seatsLeft == null) return null;
    if (seatsLeft <= 0) return 'Fully booked';
    if (seatsLeft <= 5) return `Only ${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`;
    return `${seatsLeft} seats left`;
}
