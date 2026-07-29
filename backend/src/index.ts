import "dotenv/config";
import { createApp } from "./app.js";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET must be set in production.");
  process.exit(1);
}

const PORT = process.env.PORT ?? 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Whisk API running on http://localhost:${PORT}`);
});
