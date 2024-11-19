'use client';

import React from 'react';

const Modal = ({
                   isOpen,
                   onClose,
                   title,
                   children,
                   size = 'md', // sm, md, lg, xl
                   showClose = true,
               }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} p-6`}>
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors duration-200"
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}

                        {title && (
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {title}
                                </h2>
                            </div>
                        )}

                        <div className="mt-4">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;