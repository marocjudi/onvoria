import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Route de healthcheck explicite
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Log toutes les requêtes
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    if (capturedJsonResponse) {
      log(`Response: ${JSON.stringify(capturedJsonResponse).substring(0, 100)}...`);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server...");
    log(`NODE_ENV: ${process.env.NODE_ENV}`);
    log(`DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error: ${status} - ${message}`);
      log(`Stack: ${err.stack}`);

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      log("Setting up Vite in development mode");
      await setupVite(app, server);
    } else {
      log("Setting up static file serving in production mode");
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server is running on port ${port}`);
    });
  } catch (error) {
    log(`Fatal error: ${error}`);
    process.exit(1);
  }
})();
