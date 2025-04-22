import { attach } from "neovim";
import startServer from "./server.js";

const client = attach({ socket: process.env.NVIM_LISTEN_ADDRESS });
let serverCleanup;

// Handle clean shutdown on signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log("Shutdown signal received, cleaning up...");
  if (serverCleanup) {
    serverCleanup();
  }
  process.exit(0);
}

startServer(client).then((cleanup) => {
  console.log("Server started");
  serverCleanup = cleanup;
}).catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
