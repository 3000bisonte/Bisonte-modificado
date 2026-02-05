# ACTA DE ENTREGA FINAL Y GARANTÍA DE SERVICIO - BISONTE LOGÍSTICA

**Fecha:** 14 de Diciembre de 2025  
**Proyecto:** Aplicación Web y Móvil "Bisonte Logística"  
**Versión:** 1.0 (Release Candidate)

---

## 1. OBJETO DEL DOCUMENTO
El presente documento formaliza la entrega final del desarrollo de software contratado para la plataforma "Bisonte Logística", certificando que se han cumplido a cabalidad los requerimientos funcionales, técnicos y de diseño acordados inicialmente. Asimismo, se establecen los términos y condiciones de la garantía post-implementación.

## 2. ALCANCE Y FUNCIONALIDADES ENTREGADAS
Se certifica la entrega, despliegue y correcto funcionamiento de los siguientes módulos y características, dando cumplimiento a la propuesta de trabajo aprobada:

### A. Plataforma y Despliegue

- [x] **Aplicación Móvil Android:** Generación y entrega de APK firmado, optimizado y listo para distribución o carga a Play Store. **Disponible en 19,758 dispositivos.**
- [x] **Código Fuente:** Repositorio actualizado, refactorizado y limpio en GitHub (3000bisonte).

### B. Rediseño y Experiencia de Usuario (UI/UX)
- [x] **Diseño Moderno y Profesional:** Implementación de nueva identidad visual con paleta de colores corporativa, iconos e ilustraciones.
- [x] **Diseño Responsive:** Adaptabilidad total garantizada en dispositivos móviles, tablets y computadores de escritorio.
- [x] **Feedback al Usuario:** Implementación de indicadores de carga (loading states), mensajes de éxito/error claros y validaciones visuales en tiempo real.

### C. Funcionalidades Core (Cotización y Envíos)
- [x] **Cotizador Inteligente:** Cálculo preciso de tarifas basado en peso, dimensiones y clasificación del envío (**Sobre** vs. **Paquete**).
- [x] **Persistencia de Datos:** Sistema de guardado temporal (localStorage) que evita la pérdida de información de la cotización al recargar la página.
- [x] **Formularios de Envío:** Captura validada de datos de Remitente y Destinatario, incluyendo **Tipo y Número de Documento**.
- [x] **Gestión de Direcciones:** Validación de campos requeridos para asegurar la entregabilidad.

### D. Pagos y Transacciones
- [x] **Integración MercadoPago:** Flujo completo de pago seguro (Tarjetas de Crédito/Débito, PSE).
- [x] **Manejo de Estados:** Confirmación automática de transacciones y manejo de respuestas (aprobado, rechazado, pendiente).

### E. Sistema de Notificaciones
- [x] **Correos Transaccionales al Cliente:** Envío automático de confirmación de pedido con resumen de la orden.
- [x] **Alertas Administrativas Completas:** Notificación detallada al administrador que incluye:
    - Datos completos de remitente y destinatario (Nombre, Teléfono, Dirección, **Documento de Identidad**).
    - Detalles técnicos del paquete (Peso, Dimensiones, Valor Declarado, **Tipo de Envío: Sobre/Paquete**).
    - Estado del pago, desglose de costos y ID de transacción.
    - Payload JSON completo para auditoría.

### F. Módulos Adicionales y Calidad Técnica
- [x] **Autenticación:** Sistema seguro de registro, inicio de sesión y recuperación de contraseña.
- [x] **Panel Administrativo:** Interfaz para la visualización y gestión de órdenes/envíos.
- [x] **Publicidad:** Integración optimizada de anuncios (AdMob) con carga fluida y manejo de errores para no afectar la UX.
- [x] **Limpieza de Código:** Eliminación de funciones obsoletas y optimización del rendimiento general.
- [x] **Manejo de Errores:** Sistema global de captura de errores (conexión, API) con mensajes amigables al usuario.

## 3. CUMPLIMIENTO DE REQUERIMIENTOS INICIALES
El equipo de desarrollo declara haber completado satisfactoriamente los puntos críticos solicitados:
1.  **Rediseño completo de la app:** CUMPLIDO.
2.  **Validaciones en formularios:** CUMPLIDO.
3.  **Manejo de errores:** CUMPLIDO.
4.  **Mejora inteligente de anuncios:** CUMPLIDO.
5.  **Guardado de cotización:** CUMPLIDO.
6.  **Limpieza del código:** CUMPLIDO.
7.  **Publicación (Web/Android):** CUMPLIDO.

## 4. TÉRMINOS DE GARANTÍA
Como parte del compromiso de calidad, se establece un periodo de garantía técnica bajo las siguientes condiciones:

*   **Duración:** 2 (dos) meses calendario.
*   **Fecha de Inicio:** A partir de la fecha de puesta en producción oficial de la aplicación.
*   **Alcance de la Cobertura:**
    *   Soporte técnico para la corrección de "bugs", fallos o errores de programación sobre las funcionalidades entregadas.
    *   Solución a problemas de integración con servicios externos (MercadoPago, Resend, Base de Datos) atribuibles al código desarrollado.
    *   Ajustes menores de visualización o comportamiento que no impliquen cambios de diseño estructural o nuevas funcionalidades.
*   **Exclusiones:**
    *   Desarrollo de nuevas funcionalidades no contempladas en el alcance inicial de este contrato.
    *   Cambios drásticos en APIs de terceros que requieran una reingeniería mayor del sistema.
    *   Mal funcionamiento debido a modificaciones directas en el código fuente realizadas por personal ajeno al equipo de desarrollo original.

## 5. ACEPTACIÓN
Con la entrega de este documento, el código fuente actualizado, y los binarios de la aplicación (APK), se da por finalizada la etapa de desarrollo e inicia el periodo de garantía estipulado.

---
