import { attach } from "neovim";
import startServer from "./server.js";

const client = attach({ socket: process.env.NVIM_LISTEN_ADDRESS });
startServer(client);
