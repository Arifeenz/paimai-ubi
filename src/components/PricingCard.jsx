'use client';

import { Check } from 'lucide-react';
import Button from './Button';

export default function PricingCard({
    name,
    price,
    isBestSeller = false,
    features = []
}) {
    return (
        <div className={`
      relative rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300
      ${isBestSeller
                ? 'border-green-600 bg-green-50 shadow-xl scale-105'
                : 'border-gray-200 bg-white hover:shadow-lg'
            }
    `}>
            {isBestSeller && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    ⭐ Best Seller
                </div>
            )}

            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-green-600">{price}</span>
                    <span className="text-gray-600">THB</span>
                </div>
                {price > 0 && <p className="text-sm text-gray-500 mt-1">ต่อเดือน</p>}
            </div>

            <ul className="space-y-3 mb-6">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                variant={isBestSeller ? 'primary' : 'secondary'}
                className="w-full"
            >
                {price === 0 ? 'เริ่มใช้ฟรี' : 'เลือกแพ็กเกจนี้'}
            </Button>
        </div>
    );
}
