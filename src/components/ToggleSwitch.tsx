import React from 'react';

interface ToggleSwitchProps {
    label: string;
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, id, checked, onChange, disabled = false }) => {
    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    return (
        <div className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-white">
            <label htmlFor={id} className="text-sm font-medium text-light-text cursor-pointer">
                {label}
            </label>
            <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium transition-colors ${checked ? 'text-blue-600' : 'text-gray-400'}`}>
                    {checked ? 'Visível' : 'Invisível'}
                </span>
                <button
                    id={id}
                    role="switch"
                    aria-checked={checked}
                    onClick={handleToggle}
                    disabled={disabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        checked ? 'bg-blue-600' : 'bg-gray-200'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
        </div>
    );
};

export default ToggleSwitch;