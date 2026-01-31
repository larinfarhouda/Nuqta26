/**
 * Helper component for form field labels with required indicator
 */
interface FormLabelProps {
    children: React.ReactNode;
    required?: boolean;
    htmlFor?: string;
    className?: string;
}

export function FormLabel({ children, required = false, htmlFor, className = '' }: FormLabelProps) {
    return (
        <label htmlFor={htmlFor} className={`text-sm font-bold text-gray-700 ${className}`}>
            {children}
            {required && <span className="text-red-500 mr-1" aria-label="required">*</span>}
        </label>
    );
}

/**
 * Helper component for error messages with proper accessibility
 */
interface FormErrorProps {
    error?: { message?: string };
    id: string;
}

export function FormError({ error, id }: FormErrorProps) {
    if (!error?.message) return null;

    return (
        <p id={id} className="text-red-500 text-xs font-bold mt-1" role="alert">
            {error.message}
        </p>
    );
}
