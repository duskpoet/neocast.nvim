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

M._config = {
  open_browser = true,
  port = 9999,
  start_ngrok = false,
}

M.setup = function(config)
  if config then
    M._config.open_browser = config.open_browser or M._config.open_browser
    M._config.port = config.port or M._config.port
    M._config.start_ngrok = config.start_ngrok or M._config.start_ngrok
  end

  if not vim.fn.executable("npm") then
    print("npm is not installed. Please install it to use this plugin.")
    return
  end

  if not vim.fn.executable("ngrok") and M._config.start_ngrok then
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
  vim.system({ "npm", "start" }, {
    cwd = vim.fs.joinpath(current_dir, "../../js"),
    env = {
      NVIM_LISTEN_ADDRESS = "/tmp/neocast",
      ALLOW_CONSOLE = "1",
      PORT = tostring(M._config.port),
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
    print("Server stopped")
  end)

  local serve_url = "http://localhost:" .. M._config.port

  if M._config.start_ngrok then
    vim.system({ "ngrok", "http", tostring(M._config.port) }, {
      stderr = function(_, data)
        if data then
          print("Ngrok error: " .. data)
        end
      end,
    })

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

  if M._config.open_browser then
    vim.system({ "open", serve_url }, {
      -- stdout = function(_, data)
      --   if data then
      --     print("Browser output: " .. data)
      --   end
      -- end,
      stderr = function(_, data)
      end,
    })
  end
end

return M
