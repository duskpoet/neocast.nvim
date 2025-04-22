import { createServer } from "node:http";
import { createServer as createViteServer } from "vite";

/** @param {neovim.NeovimClient} nvim */
async function boot(nvim) {
  const server = createServer(async (req, res) => {
    const cols = await nvim.getOption("columns");
    const rows = await nvim.getOption("lines");
    let resetId = null;
    function reset() {
      if (resetId) {
        return;
      }
      resetId = setTimeout(() => {
        nvim.uiTryResize(+cols, +rows);
        resetId = null;
      }, 300);
    }

    const url = new URL(req.url, `http://localhost`);
    if (url.pathname === "/events" && req.method === "GET") {
      console.log("Client connected");
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      });
      nvim.on("notification", (event, payload) => {
        console.log("EVENT");
        console.log(event);
        console.log(payload);
        res.write("event: nvim\n");
        res.write(
          "data: " +
          JSON.stringify({ event, payload }, (key, value) => {
            // avoid circular references
            if (value?.constructor?.toString()?.startsWith("class")) {
              return "class omitted";
            }
            return value;
          }),
        );
        res.write("\n\n");
        if (payload?.some(([event]) => event === "grid_scroll")) {
          reset();
        }
      });
      nvim.uiAttach(+cols, +rows, {
        ext_linegrid: true,
        ext_termcolors: true,
        ext_multigrid: false,
      }).catch((e) => {
        res.write("event: xerror\n");
        res.write("data: {\"message\": \"UI attach failed\"}");
        res.write("\n\n");
        res.end();
        nvim.uiDetach();
      });
      req.on("close", () => {
        console.log("Client disconnected");
        nvim.uiDetach();
      });
    }
  });

  const serverPort = await new Promise((resolve) =>
    server.listen({ port: 0 }, () => {
      const port = server.address().port;
      console.log(`Server started on port ${port}`);
      resolve(port);
    }),
  );

  const viteServer = await createViteServer({
    root: process.cwd(),
    server: {
      proxy: {
        "/events": {
          target: `http://localhost:${serverPort}`,
        },
      },
      allowedHosts: true,
    },
  });
  await viteServer.listen(+process.env.PORT || 9999);
  console.log("Vite server started on port 9999");

  // Return a cleanup function to properly close servers
  return function cleanup() {
    console.log("Cleaning up servers...");

    // Closing connected clients and detach UI
    nvim.uiDetach().catch(err => console.error("Error detaching UI:", err));

    // Close both servers
    return Promise.all([
      new Promise(resolve => {
        server.close(err => {
          if (err) console.error("Error closing HTTP server:", err);
          console.log("HTTP server closed");
          resolve();
        });
      }),
      new Promise(resolve => {
        viteServer.close().then(() => {
          console.log("Vite server closed");
          resolve();
        }).catch(err => {
          console.error("Error closing Vite server:", err);
          resolve();
        });
      })
    ]);
  };
}

export default boot;
