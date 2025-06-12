import React from 'react';
import { BossDisplay } from './BossDisplay';

// This component is shown during the fade-out between bosses.
// Its only job is to continue showing the BossDisplay.
export function TransitionalScreen() {
    return (
        <>
            <BossDisplay />
            {/* We could add a text overlay here if we wanted, like "Entering next chamber..." */}
        </>
    );
}
