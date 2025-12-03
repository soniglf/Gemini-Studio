
import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { KeyVault, KeyHealth } from '../services/ai/keyVault';

type HealthStatus = 'OK' | 'WARNING' | 'CRITICAL';
interface SystemHealth {
    dbOk: boolean;
    keyHealth: KeyHealth | null;
    status: HealthStatus;
    message: string | null;
}

export const useSystemHealth = () => {
    const [health, setHealth] = useState<SystemHealth>({
        dbOk: true,
        keyHealth: null,
        status: 'OK',
        message: null,
    });

    useEffect(() => {
        const checkHealth = async () => {
            const dbOk = await db.checkHealth();
            const keyHealth = KeyVault.getHealth();
            
            let status: HealthStatus = 'OK';
            let message: string | null = null;

            if (!keyHealth.hasEnv && keyHealth.paidCount === 0) {
                status = 'CRITICAL';
                message = 'Missing API Keys. Please configure a PAID key in the Stats panel to enable core features.';
            } else if (!dbOk) {
                status = 'CRITICAL';
                message = 'Local database is unresponsive. A System Reset may be required to continue.';
            } else if (keyHealth.status === 'DEGRADED') {
                status = 'WARNING';
                message = 'No PAID keys found. Pro features like Video Generation are disabled.';
            }

            setHealth({ dbOk, keyHealth, status, message });
        };

        checkHealth();
        const interval = setInterval(checkHealth, 15000); // Re-check periodically
        return () => clearInterval(interval);
    }, []);

    return health;
};
