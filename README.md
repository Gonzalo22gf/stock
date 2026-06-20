<div align="center">

<img src="https://img.shields.io/badge/StockAlert-v4.0-6366f1?style=for-the-badge&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge" />

# 📦 StockAlert — Sistema de Control de Inventario

**Plataforma SaaS para gestión de inventario con alertas de vencimiento, control de stock y dashboard ejecutivo en tiempo real.**

[🚀 Ver demo en vivo](https://gonzalo22gf.github.io/stock/) · [📂 Repositorio backend](#)

</div>

---

## 💡 El problema que resuelve

Los negocios de productos perecederos pierden entre el **8% y el 15% de su inventario** por vencimientos no detectados a tiempo o stock sin rotación. En una farmacia, supermercado o distribuidora mediana, eso representa decenas de miles de pesos en pérdidas directas **cada mes**.

La gestión manual en papel o planillas de Excel tiene tres problemas críticos:

- ❌ No hay alertas automáticas antes de que un producto venza
- ❌ No hay visibilidad en tiempo real del stock en múltiples sucursales
- ❌ No hay trazabilidad de quién hizo qué cambio y cuándo

**StockAlert resuelve los tres.**

---

## 💰 Propuesta de valor

| Métrica | Sin StockAlert | Con StockAlert |
|---|---|---|
| Tiempo en auditar inventario | 2-4 horas semanales | 5 minutos (dashboard en vivo) |
| Detección de vencimientos | Al vencerse (tarde) | 7-30 días antes (configurable) |
| Trazabilidad de cambios | Ninguna | Historial completo con usuario y fecha |
| Visibilidad multi-sucursal | Reportes manuales | Panel comparativo en tiempo real |
| Pérdida estimada por vencimientos | 8-15% del inventario | < 2% con alertas activas |

> **Caso real:** Un supermercado con $1.000.000 ARS de inventario mensual pierde ~$120.000 en vencimientos. Con StockAlert detectando alertas 7 días antes, esa cifra baja a menos de $20.000. El sistema se paga solo.

---

## ✨ Funcionalidades principales

### 🏪 Multi-sucursal
- Panel admin global con visibilidad de todas las sucursales
- Comparativo de riesgo por sucursal en tiempo real
- Transferencia de productos entre sucursales
- Roles diferenciados: Administrador / Jefe / Usuario

### ⚠️ Sistema de alertas inteligente
- Alertas configurables (7, 14, 30 días antes del vencimiento)
- Clasificación automática: **Vencido / Por vencer / En buen estado**
- Umbral de stock crítico personalizable por negocio
- Ranking de "Top 10 productos más riesgosos" con puntaje calculado
- Badge de alertas en tiempo real en el sidebar

### 📊 Dashboard ejecutivo
- KPIs en vivo: productos críticos, valor en riesgo, próximos a vencer, sucursal más crítica
- Gráficos: estado del inventario, productos por categoría, stock y valor por categoría
- Tabla de "Acciones urgentes" con prioridad Alta / Media / Baja
- Tendencias comparativas (↑ ↓ =) entre sesiones

### 📷 Escáner EAN integrado
- Escaneo de códigos de barra por cámara (móvil y desktop)
- FAB flotante para agregar productos escaneando desde cualquier parte de la app
- Vibración táctil en detección (mobile)

### 📁 Importar / Exportar
- Exportar inventario completo a **Excel (.xlsx)** con todos los campos
- Exportar historial de movimientos a Excel
- Importar productos desde CSV con validación automática

### 📋 Historial de auditoría completo
- Registro de cada CREATE / UPDATE / DELETE con usuario, fecha y detalle
- Filtros por acción, sucursal, usuario y rango de fechas
- Exportable a Excel para auditorías externas

---

## 🛠️ Stack tecnológico

### Frontend
- **Vanilla HTML / CSS / JavaScript** — sin frameworks, carga instantánea
- Design system propio con CSS variables (dark/light mode)
- Sidebar colapsable, responsive completo hasta 400px
- Chart.js para gráficos ejecutivos
- SweetAlert2 para modales
- html5-qrcode para escáner EAN
- SheetJS (xlsx) para exportación Excel

### Backend
- **Node.js + Express** — API REST
- **MongoDB + Mongoose** — base de datos NoSQL
- **JWT** para autenticación stateless
- Desplegado en **Render**

---

## 🚀 Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/gonzalo22gf/stock.git
cd stock

# Abrir index.html en el navegador
# (No requiere build — vanilla JS)
open index.html
```

> El frontend se conecta automáticamente a la API en producción (`https://stockalert-api.onrender.com`). Para correr el backend local, consultá el repo del backend.

---

## 📱 Capturas

| Dashboard ejecutivo | Cards de producto | Historial de movimientos |
|---|---|---|
| KPIs + gráficos en tiempo real | Stock / Precio / Vencimiento de un vistazo | Tags compactos con trazabilidad completa |

---

## 🎯 Mercado objetivo

- **Supermercados y minimercados** con múltiples sucursales
- **Farmacias** con vencimientos críticos y obligaciones regulatorias
- **Distribuidoras** de productos perecederos
- **Restaurantes y cadenas de food service**
- Cualquier negocio con inventario físico que necesite trazabilidad

---

## 🔮 Roadmap

- [ ] Notificaciones push (alertas sin abrir la app)
- [ ] Predicción de demanda con ML básico
- [ ] App nativa Android/iOS (PWA lista, falta wrapper)
- [ ] Integración con sistemas de facturación (AFIP / factura electrónica)
- [ ] API pública para integrar con sistemas ERP existentes
- [ ] Plan SaaS con billing por sucursal

---

## 👤 Autor

**Gonzalo** — Desarrollador Full Stack Jr.

[![GitHub](https://img.shields.io/badge/GitHub-gonzalo22gf-181717?style=flat&logo=github)](https://github.com/gonzalo22gf)

---

<div align="center">

**StockAlert v4.0** · Hecho con ☕ y JavaScript vanilla · [Demo en vivo →](https://gonzalo22gf.github.io/stock/)

</div>