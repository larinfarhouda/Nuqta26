import { z } from 'zod';

/**
 * Factory function to create validation schema with translations
 * @param t - Translation function from useTranslations('Dashboard.vendor.events.form.validation')
 * @param isEditing - Whether this is an edit form (skips past date validation)
 */
export const createEventValidationSchema = (t: (key: string) => string, isEditing: boolean = false) => {
    return z.object({
        title: z.string().min(3, t('title_min')),
        description: z.string().min(10, t('description_min')).optional().or(z.literal('')),
        event_type: z.string().min(1, t('event_type_required')),

        // Dates
        date: z.string().min(1, t('date_required')),
        end_date: z.string().optional(),

        // Location
        location_name: z.string().optional(),
        location_lat: z.number().nullable().refine(val => val !== null, t('location_required')),
        location_long: z.number().nullable().refine(val => val !== null, t('location_required')),
        district: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),

        // Capacity & Tickets
        capacity: z.coerce.number().min(1, t('capacity_min')),
        tickets: z.array(z.object({
            id: z.string().optional(),
            name: z.string().min(2, t('ticket_name_min')),
            price: z.coerce.number().min(0, t('ticket_price_min')),
            quantity: z.coerce.number().min(1, t('ticket_quantity_min'))
        })).min(1, t('tickets_min')),

        // Recurrence
        is_recurring: z.boolean().optional(),
        recurrence_type: z.string().nullable().optional(),
        recurrence_days: z.any().optional(),
        recurrence_end_date: z.string().nullable().optional(),
    })
        .refine(data => {
            if (data.is_recurring && !data.recurrence_type) return false;
            return true;
        }, {
            message: t('recurrence_type_required'),
            path: ["recurrence_type"]
        })
        .refine(data => {
            if (data.end_date && new Date(data.end_date) <= new Date(data.date)) return false;
            return true;
        }, {
            message: t('end_date_after_start'),
            path: ["end_date"]
        })
        .refine(data => {
            const totalTickets = data.tickets.reduce((acc, t) => acc + t.quantity, 0);
            return totalTickets <= data.capacity;
        }, {
            message: t('capacity_exceeded'),
            path: ["capacity"]
        })
        .refine(data => {
            // Only check for past dates on new events
            if (isEditing) return true;
            const eventDate = new Date(data.date);
            const now = new Date();
            return eventDate > now;
        }, {
            message: t('date_past'),
            path: ["date"]
        });
};
