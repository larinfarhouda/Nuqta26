/**
 * Utility for determining event status based on date and ticket availability
 */

export type EventStatus = 'active' | 'expired' | 'sold_out';

export interface EventForStatus {
    date: string;
    tickets?: { sold?: number | null; quantity: number }[];
}

/**
 * Determines the status of an event based on its date and ticket availability
 * @param event - Event object with date and optional tickets array
 * @returns 'expired' if event date is in the past, 'sold_out' if all tickets are sold, 'active' otherwise
 */
export function getEventStatus(event: EventForStatus): EventStatus {
    // Parse and validate date
    let eventDate = new Date(event.date);

    // Normalize date-only strings (YYYY-MM-DD) to local midnight
    if (typeof event.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
        const [y, m, d] = event.date.split('-').map(Number);
        eventDate = new Date(y, m - 1, d);
    }

    // Guard against invalid date strings
    if (isNaN(eventDate.getTime())) {
        return 'expired'; // Fallback for invalid data
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const comparisonDate = new Date(eventDate);
    comparisonDate.setHours(0, 0, 0, 0);

    if (comparisonDate < today) {
        return 'expired';
    }

    // Check if all tickets are sold out
    if (event.tickets && event.tickets.length > 0) {
        const allSoldOut = event.tickets.every(ticket => {
            const sold = ticket.sold || 0;
            return sold >= ticket.quantity;
        });

        if (allSoldOut) {
            return 'sold_out';
        }
    }

    return 'active';
}

/**
 * Helper to check if event is expired
 */
export function isEventExpired(event: EventForStatus): boolean {
    return getEventStatus(event) === 'expired';
}

/**
 * Helper to check if event is sold out
 */
export function isEventSoldOut(event: EventForStatus): boolean {
    return getEventStatus(event) === 'sold_out';
}

/**
 * Helper to check if event is bookable (active and has availability)
 */
export function isEventBookable(event: EventForStatus): boolean {
    return getEventStatus(event) === 'active';
}
