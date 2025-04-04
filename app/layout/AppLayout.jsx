'use client'
import React from 'react';
import ImlaaIcon from "@/app/components/icons/ImlaaIcon";
import { FlashProvider } from '@/app/contexts/FlashContext';

const AppLayout = ({ children }) => {
    return (
        <FlashProvider>
            <main className="flex flex-col min-h-screen">
                <div className="inline-flex items-center justify-center h-[6.5rem] sm:h-[6.5rem] h-[4.5rem] bg-gray-900 w-full mb-auto">
                    <ImlaaIcon className="w-40 sm:w-40 w-32" />
                </div>
                <div className="min-h-[calc(100vh-6.5rem)] sm:min-h-[calc(100vh-6.5rem)] min-h-[calc(100vh-4.5rem)] flex-1 bg-gray-50 sm:p-6 p-2">
                    {children}
                </div>
            </main>
        </FlashProvider>
    );
};

export default AppLayout;