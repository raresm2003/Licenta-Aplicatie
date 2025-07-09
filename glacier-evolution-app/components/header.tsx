"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Header() {
    const pathname = usePathname()

    const navLinks = [
        { name: "Zone Selector", href: "/" },
        { name: "Analysed Zones", href: "/visualization" }
    ]

    return (
        <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-2xl font-bold text-blue-700 hover:opacity-80 transition">
                        GlacierView
                    </Link>
                    <nav className="flex gap-6">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-base font-medium transition-colors ${pathname === link.href
                                    ? "text-blue-700"
                                    : "text-gray-700 hover:text-blue-600"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    )
}
