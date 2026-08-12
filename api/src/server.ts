import "dotenv/config";
import { createApp } from "./app";
import { prisma } from "./db";

const PORT = process.env.PORT || 4100;

async function main() {
  await prisma.$connect();
  console.log("Connected to Postgres");

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Bookmarked API listening on port http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
