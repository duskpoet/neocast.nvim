vim.api.nvim_create_user_command("Neocast", function(args)
        if args.args == "build" then
                require("neocast").build()
        elseif args.args == "launch" then
                require("neocast").launch()
        else
                print("Unknown command: " .. args.args)
        end
end, {
        nargs = 1,
        complete = function(ArgLead, CmdLine, CursorPos)
                return { "build", "launch" }
        end,
})
