'use client'
import React from 'react';
import ImlaaIcon from "@/app/components/icons/ImlaaIcon";
import { FlashProvider } from '@/app/contexts/FlashContext';
import AdminSidebar from "@/app/layout/AdminSidebar";

const AppLayout = ({ children }) => {
    return (
        <FlashProvider>
            <main className="flex flex-col min-h-screen">
                <div className="inline-flex items-center justify-center h-[6.5rem] bg-gray-900 w-full mb-auto">
                    <ImlaaIcon className="w-40" />
                </div>
                <div className="min-h-[calc(100vh-6.5rem)] flex-1 bg-gray-50 flex">
                    <div className="w-64 border-r border-gray-200 shadow bg-white">
                        <AdminSidebar />
                    </div>
                    <div className="flex-1 p-6">
                        {children}
                    </div>
                </div>
            </main>
        </FlashProvider>
    );
};

export default AppLayout;