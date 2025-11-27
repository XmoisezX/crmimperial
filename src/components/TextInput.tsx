import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const TextInput: React.FC<TextInputProps> = ({ label, id, type = 'text', ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-light-text mb-1">
                {label}
            </label>
            <input
                type={type}
                id={id}
                {...props}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-400"
            />
        </div>
    );
};

export default TextInput;