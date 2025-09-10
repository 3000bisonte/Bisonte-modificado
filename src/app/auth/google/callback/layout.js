export default function CallbackLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <title>Autenticación Google - Bisonte</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-900">
        {children}
      </body>
    </html>
  );
}
