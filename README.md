# Neocast

Neocast renders your Neovim session in a web browser, enabling remote access and viewing without SSH or terminal-based solutions.

## Features

- Access Neovim through any modern web browser
- Syntax highlighting support
- Optional ngrok integration for internet-based remote access

## Installation

Using [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  'duskpoet/neocast',
  build = function() 
    require('neocast').build()
  end,
  cmd = { 'Neocast' },
  opts = {
      open_browser = true,  -- Auto-open browser when starting
      port = 9999,          -- Web server port
      start_ngrok = false   -- Enable ngrok tunnel for remote access
  }
}
```

## Usage

1. Initialize the plugin with `:Neocast build` to install dependencies
2. Launch with `:Neocast launch` to start the server and open browser

## Requirements

- Neovim 0.12.0+
- Node.js 14.0.0+

## How it works

Neocast uses Neovim's UI API to stream editor state to a Node.js server, which renders the UI in a browser using TypeScript and HTML. The plugin maintains accurate text rendering, cursor positioning, and syntax highlighting by directly mapping Neovim's UI events to DOM elements.

## License
MIT
