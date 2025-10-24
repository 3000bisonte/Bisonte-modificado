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
        <script dangerouslySetInnerHTML={{ __html: `
          eruda.init();
          
          // Crear botón personalizado más visible
          setTimeout(function() {
            var btn = document.createElement('div');
            btn.innerHTML = '📱 DEBUG';
            btn.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#ff0000;color:white;padding:15px 25px;border-radius:50px;font-size:18px;font-weight:bold;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);cursor:pointer;';
            btn.onclick = function() {
              eruda.show();
              btn.style.display = 'none';
            };
            document.body.appendChild(btn);
          }, 1000);
        ` }} />
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