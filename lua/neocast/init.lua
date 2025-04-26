local M = {}

local function log_to_file(msg)
  local log_file = "/tmp/neocast.log"
  local file = io.open(log_file, "a")
  if file then
    file:write(msg .. "\n")
    file:close()
  else
    print("Could not open log file for writing.")
  end
end

M.setup = function(config)
  config = config or {}

  if config.open_browser == nil then
    vim.g.neocast_open_browser = true
  else
    vim.g.neocast_open_browser = config.open_browser
  end
  if config.port == nil then
    vim.g.neocast_port = 9999
  else
    vim.g.neocast_port = config.port
  end
  if config.start_ngrok == nil then
    vim.g.neocast_start_ngrok = false
  else
    vim.g.neocast_start_ngrok = config.start_ngrok
  end

  if not vim.fn.executable("npm") then
    print("npm is not installed. Please install it to use this plugin.")
    return
  end

  if not vim.fn.executable("ngrok") and config.start_ngrok then
    print("ngrok is not installed. Please install it to use this plugin.")
    return
  end
end

M.build = function()
  local current_path = debug.getinfo(1, "S").source:sub(2)
  local current_dir = vim.fn.fnamemodify(current_path, ":h")
  vim.system({ "npm", "install" }, {
    cwd = vim.fs.joinpath(current_dir, "../../js"),
    stdout = function(_, data)
      if data then
        print("Server output: " .. data)
      end
    end,
    stderr = function(_, data)
      if data then
        print("Server error: " .. data)
      end
    end,
  })
end


M.launch = function()
  vim.system({ "rm", "-rf", "/tmp/neocast" }):wait()
  vim.fn.serverstart("/tmp/neocast")
  local current_path = debug.getinfo(1, "S").source:sub(2)
  local current_dir = vim.fn.fnamemodify(current_path, ":h")

  -- Store process IDs to kill them when Neovim exits
  local node_pid
  local ngrok_pid

  local node_handle, node_pid_val = vim.system({ "npm", "start" }, {
    detached = false,
    cwd = vim.fs.joinpath(current_dir, "../../js"),
    env = {
      NVIM_LISTEN_ADDRESS = "/tmp/neocast",
      ALLOW_CONSOLE = "1",
      PORT = tostring(vim.g.neocast_port),
    },
    stderr = function(_, data)
      if data then
        print("Server error: " .. data)
      end
    end,
    stdout = function(_, data)
      if data then
        log_to_file(data)
      end
    end,
  }, function()
  end)

  node_pid = node_pid_val

  local serve_url = "http://localhost:" .. vim.g.neocast_port

  if vim.g.neocast_start_ngrok then
    local ngrok_handle, ngrok_pid_val = vim.system({ "ngrok", "http", tostring(vim.g.neocast_port) }, {
      detached = false,
      stderr = function(_, data)
        if data then
          print("Ngrok error: " .. data)
        end
      end,
    })

    ngrok_pid = ngrok_pid_val

    for i = 1, 5 do
      local ngrok_url = vim.fn.system("curl -s http://localhost:4040/api/tunnels")
      if ngrok_url ~= "" then
        local json = vim.fn.json_decode(ngrok_url)
        if json and json.tunnels and json.tunnels[1] and json.tunnels[1].public_url then
          serve_url = json.tunnels[1].public_url
          break
        end
      end
      vim.wait(1000)
    end
  end

  -- Register a single ExitPre autocmd to kill both processes
  vim.api.nvim_create_autocmd("VimLeavePre", {
    pattern = "*",
    callback = function()
      if ngrok_pid then
        vim.loop.process_kill(ngrok_pid, 'SIGTERM')
        log_to_file("Killed ngrok process: " .. ngrok_pid)
      end

      if node_pid then
        vim.loop.process_kill(node_pid, 'SIGTERM')
        log_to_file("Killed node process: " .. node_pid)

        -- Give processes a moment to terminate gracefully
        vim.wait(100)

        -- -- Force kill if still running
        -- if vim.fn.system("ps -p " .. node_pid .. " -o pid=") ~= "" then
        --   vim.loop.process_kill(node_pid, 'SIGKILL')
        --   log_to_file("Force killed node process: " .. node_pid)
        -- end
      end
    end,
    group = vim.api.nvim_create_augroup("NeoCastCleanup", { clear = true })
  })

  if vim.g.neocast_open_browser then
    vim.system({ "open", serve_url }, {
      -- stdout = function(_, data)
      --   if data then
      --     print("Browser output: " .. data)
      --   end
      -- end,
      -- stderr = function(_, data)
      -- end,
    })
  end
end

return M
