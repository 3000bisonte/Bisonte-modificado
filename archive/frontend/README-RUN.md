# Guía de Ejecución

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 3. Iniciar base de datos (si aplica)
npm run db:setup

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Iniciar servidor de desarrollo
npm run dev
```

### Producción

```bash
# 1. Build de producción
npm run build

# 2. Iniciar servidor
npm start
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción  
- `npm start` - Servidor de producción
- `npm test` - Ejecutar tests
- `npm run lint` - Linting de código

## 🐛 Solución de Problemas

### Puerto en uso
``ash
# Cambiar puerto
PORT=3001 npm run dev
```

### Problemas de permisos
``ash
# Limpiar cache
npm cache clean --force
rm -rf node_modules
npm install
```

## 📞 Soporte

Para problemas técnicos, crear issue en el repositorio.
