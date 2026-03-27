# 🚀 Render Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables (.env)
Render madhe set karayche:
```
PORT=8803
BASE_URL=https://your-app.onrender.com

# Supabase Database
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=5432
DB_USER=postgres.rsjyamhfkfcvwmjyoidl
DB_PASSWORD=Dinu@3011@6
DB_NAME=postgres

# Cloudinary
CLOUDINARY_CLOUD_NAME=dplye41hy
CLOUDINARY_API_KEY=788794394238235
CLOUDINARY_API_SECRET=YfCrzqJtTwWSqJ6YgNmrbb9d3V8

# JWT Secrets
JWT_SECRET=your-production-secret-key
JWT_REFRESH_SECRET=your-production-refresh-key
```

### 2. Package.json Scripts
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon --watch src --ext ts --exec ts-node src/server.ts"
  }
}
```

### 3. Build Command (Render)
```
npm install && npm run build
```

### 4. Start Command (Render)
```
npm start
```

---

## 🔧 Required Changes

### 1. Update app.ts - Remove pino-pretty (Production)
```typescript
const app = Fastify({
  logger: process.env.NODE_ENV === 'production' 
    ? true 
    : {
        level: "info",
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname"
          }
        }
      },
  bodyLimit: 50 * 1024 * 1024
});
```

### 2. Update server.ts - Dynamic Port
```typescript
import app from "./app";
import { config } from "./config/env";

const PORT = process.env.PORT || config.port || 8803;
const HOST = process.env.HOST || "0.0.0.0";

app.listen({ port: Number(PORT), host: HOST }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening on ${address}`);
});
```

### 3. Add .gitignore
```
node_modules/
dist/
.env
.env.local
*.log
uploads/
```

### 4. Add tsconfig.json (if missing)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 🔒 Security Fixes

### 1. Remove Hardcoded Secrets
❌ Never commit:
- Database passwords
- API keys
- JWT secrets

✅ Use environment variables only

### 2. Update CORS (Production)
```typescript
app.addHook('onRequest', async (request, reply) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  reply.header('Access-Control-Allow-Origin', allowedOrigins[0]);
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return reply.status(200).send();
  }
});
```

### 3. Database Connection - SSL Required
```typescript
// src/db/connection.ts
export const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' 
      ? { require: true, rejectUnauthorized: false }
      : false
  },
  logging: process.env.NODE_ENV === 'production' ? false : console.log,
});
```

---

## 📦 Dependencies Check

### Required Production Dependencies
```json
{
  "dependencies": {
    "fastify": "^4.29.1",
    "@fastify/multipart": "^7.7.3",
    "sequelize": "^6.37.7",
    "pg": "^8.18.0",
    "pg-hstore": "^2.3.4",
    "cloudinary": "latest",
    "dotenv": "^16.4.0",
    "bcrypt": "^6.0.0",
    "jsonwebtoken": "^9.0.3"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2",
    "@types/node": "^20.11.0",
    "nodemon": "^3.1.11",
    "pino-pretty": "^13.1.3"
  }
}
```

---

## 🗄️ Database Setup

### Supabase Tables (Auto-created by Sequelize)
- ✅ users
- ✅ roles
- ✅ clients
- ✅ students
- ✅ teachers
- ✅ admins
- ✅ attendance
- ✅ homework
- ✅ notices
- ✅ books ← New table

---

## 🌐 Render Configuration

### 1. Create New Web Service
- Repository: Connect GitHub
- Branch: main
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

### 2. Environment Variables
Add all from .env file

### 3. Health Check Path
```
/health
```

### 4. Auto-Deploy
Enable for automatic deployments

---

## 🧪 Testing Before Deploy

### 1. Local Production Build
```bash
npm run build
NODE_ENV=production npm start
```

### 2. Test Endpoints
```bash
# Health check
curl https://your-app.onrender.com/health

# Upload book
curl -X POST https://your-app.onrender.com/books/upload-file \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@book.pdf"

# Get books
curl https://your-app.onrender.com/books/CLIENT_ID/books \
  -H "Authorization: Bearer TOKEN"
```

---

## ⚠️ Common Issues & Fixes

### 1. Port Binding Error
✅ Use `0.0.0.0` as host, not `localhost`

### 2. Database Connection Timeout
✅ Enable SSL in dialectOptions
✅ Check Supabase connection pooler

### 3. File Upload Size
✅ Render has 100MB request limit
✅ Current: 50MB (OK)

### 4. Build Failures
✅ Check TypeScript errors
✅ Ensure all dependencies in package.json

### 5. Environment Variables
✅ Set all required vars in Render dashboard
✅ Update BASE_URL to Render URL

---

## 📊 Post-Deployment Monitoring

### Check Logs
```
Render Dashboard → Logs
```

### Monitor Health
```
https://your-app.onrender.com/health
```

### Database Connection
```
Check Supabase dashboard for active connections
```

---

## 🎯 Final Checklist

- [ ] All environment variables set in Render
- [ ] BASE_URL updated to Render URL
- [ ] Database SSL enabled
- [ ] Build command configured
- [ ] Start command configured
- [ ] Health check endpoint working
- [ ] CORS configured for production
- [ ] Secrets removed from code
- [ ] TypeScript compiled successfully
- [ ] All dependencies installed
- [ ] Cloudinary working
- [ ] Supabase connected

---

## 🚀 Deploy Command

```bash
git add .
git commit -m "Production ready - Book Management System"
git push origin main
```

Render will auto-deploy! 🎉
