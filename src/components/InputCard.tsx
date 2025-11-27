import React from 'react';

interface InputCardProps {
    title: string;
    children: React.ReactNode;
}

const InputCard: React.FC<InputCardProps> = ({ title, children }) => {
    return (
        <div className="space-y-4 p-5 bg-white rounded-lg shadow-md border border-gray-100">
            <h2 className="text-lg font-semibold text-primary-orange border-b border-orange-200 pb-2 mb-4">
                {title}
            </h2>
            {children}
        </div>
    );
};

export default InputCard;