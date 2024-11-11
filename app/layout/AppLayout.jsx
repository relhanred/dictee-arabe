import React from 'react';
import ImlaaIcon from "@/app/components/icons/ImlaaIcon";

const AppLayout = ({ children }) => {
    return (
        <main className="flex flex-col min-h-screen">
            <div className="inline-flex items-center justify-center h-[6.5rem] bg-gray-900 w-full mb-auto">
                <ImlaaIcon className="w-40" />
            </div>
            <div className="p-6 flex-1 bg-gray-50">
                {children}
            </div>
        </main>
    );
};

export default AppLayout;