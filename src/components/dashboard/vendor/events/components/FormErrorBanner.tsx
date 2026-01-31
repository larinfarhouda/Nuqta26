import { AlertCircle } from 'lucide-react';
import { FieldErrors } from 'react-hook-form';

interface FormErrorBannerProps {
    errors: FieldErrors<any>;
    t: (key: string) => string;
}

export default function FormErrorBanner({ errors, t }: FormErrorBannerProps) {
    const errorKeys = Object.keys(errors);

    if (errorKeys.length === 0) return null;

    // Extract meaningful error messages
    const errorMessages = errorKeys.map(key => {
        const error = (errors as any)[key];
        return error?.message || key;
    });

    return (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-red-900 mb-2">
                        {t('errors_found')}
                    </h4>
                    <p className="text-xs text-red-700 mb-2">
                        {t('please_fix_errors')}
                    </p>
                    <ul className="space-y-1">
                        {errorMessages.map((msg, idx) => (
                            <li key={idx} className="text-xs text-red-600 flex items-start gap-2">
                                <span className="text-red-400">•</span>
                                <span>{msg}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
