# 🛒 Payment App Backend

API serverless para procesar pagos con Wompi, integrada con AWS Lambda, DynamoDB y Node.js + NestJS.

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints](#endpoints)
- [Despliegue](#despliegue)
- [Variables de Entorno](#variables-de-entorno)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos

- Node.js 18+
- npm o yarn
- AWS Account (con credenciales configuradas)
- Wompi Account (para procesamiento de pagos)

---

## 📥 Instalación

Clonar el proyecto
git clone https://github.com/RicardoDev3/payment-app-backend.git
cd payment-app-backend

Instalar dependencias
npm install

Instalar dependencias globales
npm install -g serverless


---

## ⚙️ Configuración

### 1. Configurar AWS Credentials

Ingresar:
AWS Access Key ID: [tu-access-key]
AWS Secret Access Key: [tu-secret-key]
Default region: us-east-1
Default output format: json


### 2. Configurar Variables de Entorno

Crea archivo `.env`:

Wompi
WOMPI_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
WOMPI_PRIVATE_KEY=prv_stagtest_XXXXX
WOMPI_INTEGRITY_KEY=stagtest_integrity_XXXXX

DynamoDB
AWS_REGION=us-east-1

Base de Datos
BASE_FEE=2000
DELIVERY_FEE=5000

Entorno
ENVIRONMENT=development


### 3. Inicializar Base de Datos

npm run init:dynamodb
npm run seed:products


---

## 📂 Estructura del Proyecto

src/
├── application/ # Lógica de aplicación
│ ├── use-cases/ # Casos de uso
│ └── dto/ # Data Transfer Objects
├── domain/ # Lógica de negocio
│ ├── entities/ # Entidades
│ └── repositories/ # Interfaces de repositorios
├── infrastructure/ # Implementación técnica
│ ├── external/ # Integraciones externas (Wompi)
│ ├── repositories/ # Implementación de repositorios
│ └── handlers/ # Handlers de Lambda
├── shared/ # Código compartido
│ ├── types/ # Tipos TypeScript
│ └── errors/ # Errores personalizados
└── config/ # Configuración


---

## 🚀 Despliegue

### Desarrollo Local

Iniciar servidor local
npm run start:dev

Debería mostrar:
✅ Application is running on: http://localhost:3000/api


Repositorio: [payment-app-frontend](https://github.com/RicardoDev3/payment-app-fronted.git)

---

## 🔗 Links Útiles

- [Documentación Wompi](https://docs.wompi.co/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [DynamoDB](https://aws.amazon.com/dynamodb/)
- [Serverless Framework](https://www.serverless.com/)

---

## 👨‍💻 Autor

Ricardo Lozano - [GitHub](https://github.com/ricardodev3)

---

## 📄 Licencia

MIT - Libre para usar en proyectos personales y comerciales.

---

## ✨ Características

- ✅ Procesamiento de pagos con Wompi
- ✅ Serverless en AWS Lambda
- ✅ Base de datos DynamoDB
- ✅ TypeScript + NestJS
- ✅ Arquitectura limpia (Domain-Driven Design)
- ✅ Manejo de errores robusto
- ✅ Logs detallados

---

## 🚀 Próximas Mejoras

- [ ] Autenticación JWT
- [ ] Validación de email
- [ ] Notificaciones por email
- [ ] Panel de administración
- [ ] Historial de transacciones
- [ ] Reportes de ventas

---

**Última actualización:** Noviembre 4, 2025
