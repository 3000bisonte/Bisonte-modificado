"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", label: "Inicio" },
  { href: "/misenvios", label: "Mis envíos" },
  { href: "/perfilCard", label: "Mi perfil" },
  { href: "/contacto", label: "Contáctanos" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#18191A] border-t border-gray-700 z-50">
      <div className="flex justify-around items-center py-2 px-2 gap-x-1 flex-wrap max-w-screen">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 text-center py-2 transition text-xs sm:text-sm ${
              pathname === item.href
                ? "text-[#41e0b3] font-semibold"
                : "text-gray-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
