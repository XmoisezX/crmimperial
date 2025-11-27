import React from 'react';

interface CollapsibleCardProps {
    title: React.ReactNode;
    children: React.ReactNode;
    isOpenDefault?: boolean;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, children, isOpenDefault = false }) => {
    return (
        <details className="border border-gray-200 rounded-lg bg-white shadow-sm" open={isOpenDefault}>
            <summary className="cursor-pointer p-4 bg-gray-50 rounded-t-lg text-md font-semibold text-primary-orange list-none flex justify-between items-center hover:bg-orange-100 transition-colors">
                {title}
                <svg className="w-5 h-5 chevron text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </summary>
            <div className="p-4 space-y-4 border-t border-gray-200">
                {children}
            </div>
        </details>
    );
};

export default CollapsibleCard;