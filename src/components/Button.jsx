'use client';

import { clsx } from 'clsx';

export default function Button({
    children,
    variant = 'primary',
    className,
    ...props
}) {
    const baseClasses = "px-6 py-3 rounded-full font-medium transition-all duration-200 text-base";

    const variantClasses = {
        primary: "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl active:scale-95",
        secondary: "bg-white text-green-600 border-2 border-green-600 hover:bg-green-50 active:scale-95"
    };

    return (
        <button
            className={clsx(baseClasses, variantClasses[variant], className)}
            {...props}
        >
            {children}
        </button>
    );
}
