import React from 'react';
import Link from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Barra de navegación superior */}
      <header className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Inspecciones Lab
          </Link>
          <nav>
            <Link href="/" className="hover:underline">Inicio</Link>
          </nav>
        </div>
      </header>

      {/* Área de contenido principal donde se inyectan las páginas */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4">
        {children}
      </main>

      {/* Footer básico */}
      <footer className="bg-gray-800 text-white p-4 text-center text-sm mt-auto">
        <p>&copy; 2026 Sistema de Inspecciones PWA</p>
      </footer>
    </div>
  );
}