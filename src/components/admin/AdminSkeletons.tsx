/**
 * Admin Loading Skeletons
 * Reusable skeleton components for admin pages
 */

export function StatCardSkeleton() {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                animation: 'pulse 1.5s ease-in-out infinite',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '100px', height: '14px', background: '#e2e8f0', borderRadius: '6px' }} />
                <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '12px' }} />
            </div>
            <div style={{ width: '80px', height: '28px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '8px' }} />
            <div style={{ width: '60px', height: '12px', background: '#e2e8f0', borderRadius: '6px' }} />
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} style={{ padding: '16px' }}>
                    <div
                        style={{
                            height: '16px',
                            background: '#e2e8f0',
                            borderRadius: '6px',
                            width: i === 0 ? '60%' : i === columns - 1 ? '80px' : '80%',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            animationDelay: `${i * 100}ms`,
                        }}
                    />
                </td>
            ))}
        </tr>
    );
}

export function ChartSkeleton() {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                height: '300px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '12px',
                animation: 'pulse 1.5s ease-in-out infinite',
            }}
        >
            {[40, 65, 50, 80, 60, 75, 45, 70, 55, 85, 50, 65].map((h, i) => (
                <div
                    key={i}
                    style={{
                        width: '24px',
                        height: `${h}%`,
                        background: '#e2e8f0',
                        borderRadius: '4px 4px 0 0',
                        animationDelay: `${i * 100}ms`,
                    }}
                />
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div style={{ maxWidth: '1400px' }}>
            <div style={{ marginBottom: '32px' }}>
                <div style={{ width: '180px', height: '30px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '8px' }} />
                <div style={{ width: '280px', height: '16px', background: '#e2e8f0', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton />
            </div>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div
            style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
            }}
        >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} style={{ padding: '14px 16px', textAlign: 'left' }}>
                                <div style={{ width: '70px', height: '12px', background: '#e2e8f0', borderRadius: '4px' }} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
