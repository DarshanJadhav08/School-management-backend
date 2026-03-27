import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { sequelize, connectDB } from "./db/connection";
import "./models";
import routes from "./routes";

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname"
      }
    }
  },
  bodyLimit: 50 * 1024 * 1024,
  pluginTimeout: 60000 // 60 seconds timeout
});

// CORS manually add
app.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  
  if (request.method === 'OPTIONS') {
    return reply.status(200).send();
  }
});

// Register multipart for file uploads
app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// DB connect - non-blocking
connectDB()
  .then(() => {
    app.log.info("Database connected");
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.log.info("Models synced");
  })
  .catch((err) => {
    app.log.error("Database connection error:", err);
  });

// Register all routes
app.register(routes);

// Test routes
app.get("/", async () => {
  return { message: "ZP SCHOOL server is running" };
});

app.get("/health", async () => {
  try {
    await sequelize.authenticate();
    return { status: "OK", database: "connected" };
  } catch {
    return { status: "ERROR", database: "disconnected" };
  }
});

export default app;
