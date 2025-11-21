import express from "express";
import { setupRoutes } from "../server/setup-routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup all routes (includes initialization)
setupRoutes(app).catch(error => {
  console.error('[Vercel] Failed to setup routes:', error);
});

// Export for Vercel
export default app;
