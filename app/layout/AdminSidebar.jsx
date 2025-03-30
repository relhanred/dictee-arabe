'use client'
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {DashboardIcon} from "@/app/components/icons/DashboardIcon";
import {LetterIcon} from "@/app/components/icons/LetterIcon";
import {TextIcon} from "@/app/components/icons/TextIcon";
import {MenuIcon} from "@/app/components/icons/MenuIcon";

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const tabs = [
        {
            name: 'Vue d\'ensemble',
            path: '/admin',
            icon: DashboardIcon
        },
        {
            name: 'Lettres',
            path: '/admin/letters',
            icon: LetterIcon
        },
        {
            name: 'Textes',
            path: '/admin/texts',
            icon: TextIcon
        }
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-white"
            >
                <MenuIcon className="w-6 h-6 text-gray-600" />
            </button>

            <div
                className={`
                    fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden
                    ${isOpen ? 'block' : 'hidden'}
                `}
                onClick={() => setIsOpen(false)}
            />

            <div
                className={`
                    fixed md:static inset-y-0 left-0 z-40
                    w-full bg-white border-r border-gray-200
                    transform transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="p-6 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 px-4">
                        Administration
                    </h2>

                    <nav className="space-y-2">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.path;
                            const TabIcon = tab.icon;

                            return (
                                <button
                                    key={tab.path}
                                    onClick={() => {
                                        router.push(tab.path);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                                        transition-colors duration-200
                                        ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}
                                    `}
                                >
                                    <span className={isActive ? 'text-white' : 'text-gray-400'}>
                                        <TabIcon className="w-6 h-6" />
                                    </span>
                                    <span className="font-medium">
                                        {tab.name}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </>
    );
}