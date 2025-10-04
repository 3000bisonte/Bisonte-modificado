
# 🔧 Script de corrección automática
# Ejecutar después de decidir la opción

# OPCIÓN A: Actualizar a www.bisonteapp.com
# sed -i 's|NEXTAUTH_URL=https://bisonteapp.com|NEXTAUTH_URL=https://www.bisonteapp.com|g' .env.production

# OPCIÓN B: Actualizar URLs públicas para consistencia
# sed -i 's|NEXT_PUBLIC_SITE_URL=https://bisonteapp.com|NEXT_PUBLIC_SITE_URL=https://www.bisonteapp.com|g' .env.production
# sed -i 's|NEXT_PUBLIC_API_BASE_URL=https://bisonteapp.com/api|NEXT_PUBLIC_API_BASE_URL=https://www.bisonteapp.com/api|g' .env.production
