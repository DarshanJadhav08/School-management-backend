import app from "./app";
import { config } from "./config/env";

const PORT = Number(process.env.PORT) || config.port || 8803;
const HOST = process.env.HOST || "0.0.0.0";

const start = async () => {
  try {
    await app.listen({
      port: PORT,
      host: HOST
    });

    app.log.info(`Server is running on ${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
