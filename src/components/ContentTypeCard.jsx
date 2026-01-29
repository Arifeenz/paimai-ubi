'use client';

export default function ContentTypeCard({
    type,
    title,
    icon: Icon,
    description,
    gradient,
    isSelected = false,
    onClick
}) {
    return (
        <div
            onClick={() => onClick(type)}
            className={`
                relative cursor-pointer rounded-2xl p-6 transition-all duration-300
                ${isSelected
                    ? 'ring-4 ring-green-500 shadow-2xl scale-105'
                    : 'ring-2 ring-gray-200 hover:ring-green-400 hover:shadow-xl hover:scale-102'
                }
            `}
        >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 rounded-2xl`}></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Icon */}
                <div className={`
                    w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} 
                    flex items-center justify-center mb-4 shadow-lg
                `}>
                    <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                    {description}
                </p>

                {/* Selected Badge */}
                {isSelected && (
                    <div className="absolute top-4 right-4">
                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            เลือกแล้ว
                        </div>
                    </div>
                )}
            </div>

            {/* Hover Effect Border */}
            <div className={`
                absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} 
                opacity-0 ${!isSelected && 'group-hover:opacity-5'} transition-opacity
            `}></div>
        </div>
    );
}
