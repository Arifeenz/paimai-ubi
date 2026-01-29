'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PersonaCard({
    name,
    business,
    location,
    emoji,
    personaId,
    gradient
}) {
    return (
        <Link
            href={`/magic?persona=${personaId}`}
            className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>

            <div className="relative p-6">
                <div className="text-5xl mb-4">{emoji}</div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
                <p className="text-gray-600 mb-1">{business}</p>
                <p className="text-sm text-gray-500 mb-4">📍 {location}</p>

                <div className="flex items-center gap-2 text-green-600 font-medium group-hover:gap-3 transition-all">
                    <span>ลองสร้างคอนเทนต์</span>
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}
