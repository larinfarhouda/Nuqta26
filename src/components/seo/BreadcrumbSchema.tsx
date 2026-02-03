/**
 * BreadcrumbSchema Component
 * Generates JSON-LD structured data for breadcrumb navigation
 */

import { generateBreadcrumbSchema } from '@/lib/seo';

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbSchemaProps {
    items: BreadcrumbItem[];
}

export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
    const schema = generateBreadcrumbSchema(items);

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
