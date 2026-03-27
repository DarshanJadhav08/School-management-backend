# ZP School Management System

Node.js + Fastify + TypeScript + PostgreSQL

## 📁 Folder Structure

```
src/
├── config/          # Configuration files
├── constants/       # Constants and enums
├── controllers/     # Request handlers
├── db/              # Database
│   ├── hooks/       # Database hooks
│   └── migrations/  # Database migrations
├── interfaces/      # TypeScript interfaces
├── loaders/         # App loaders (Fastify setup)
├── middleware/      # Custom middlewares
├── models/          # Database models
├── plugins/         # Fastify plugins
├── repositories/    # Database operations
├── routes/          # API routes
├── services/        # Business logic
├── utility/         # Utility functions
└── server.ts        # Entry point
```

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

4. Visit: `http://localhost:3000`

## 📋 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## 🔗 API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
