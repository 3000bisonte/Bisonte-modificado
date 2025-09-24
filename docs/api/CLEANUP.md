Limpieza aplicada:

1. Refuerzo de .gitignore (logs, builds, dist, coverage, env locales, backups).
2. Marcado para eliminación futura: `legacy/` (contiene solo referencias históricas).
3. Directorio `apps/web` vacío ignorado para evitar confusión.
4. Siguiente fase sugerida:
   - Migrar funciones Netlify a repo separado o submódulo si crecen.
   - Añadir tests mínimos (health, login, refresh) antes de más refactors.
   - Consolidar configuración env en README con tabla de variables.

No se eliminaron todavía directorios con posible valor (legacy/) hasta confirmación.
