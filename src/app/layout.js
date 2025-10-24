import './globals.css';
import { Inter } from 'next/font/google';

import { Providers } from './Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Bisonte Logística',
  description: 'Sistema de gestión logística integral',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Eruda - Mobile debugging console */}
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script dangerouslySetInnerHTML={{ __html: `eruda.init();` }} />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}