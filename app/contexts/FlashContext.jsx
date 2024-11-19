'use client'

import React, { createContext, useContext, useState } from 'react';
import FlashMessage from '@/app/components/FlashMessage';

const FlashContext = createContext({
    showFlash: () => {},
    hideFlash: () => {},
});

export function FlashProvider({ children }) {
    const [flash, setFlash] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const showFlash = (message, type = 'success') => {
        setFlash({ show: true, message, type });
    };

    const hideFlash = () => {
        setFlash(prev => ({ ...prev, show: false }));
    };

    return (
        <FlashContext.Provider value={{ showFlash, hideFlash }}>
            {flash.show && (
                <FlashMessage
                    message={flash.message}
                    type={flash.type}
                    isVisible={flash.show}
                    onHide={hideFlash}
                />
            )}
            {children}
        </FlashContext.Provider>
    );
}

export const useFlash = () => {
    const context = useContext(FlashContext);
    if (!context) {
        throw new Error('useFlash must be used within a FlashProvider');
    }
    return context;
};