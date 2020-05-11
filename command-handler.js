module.exports = 
{
    handleInput: (input) =>
    {
        if(!input)
            return true;

        input = input.trim();

        let split = [];

        let inQuote = false;
        let inEscape = false;

        let nextStr = '';

        for(let i = 0; i < input.length; i++)
        {
            let c = input.charAt(i);

            if(c !== '\\')
            {
                if(c === '"' && !inEscape)
                {
                    inQuote = !inQuote;
                }
                else if(input.charAt(i) === ' ' && !inQuote)
                {
                    split.push(nextStr);
                    nextStr = '';
                }
                else
                {
                    nextStr += c;
                }

                inEscape = false;
            }
            else
            {
                inEscape = !inEscape;
                if(!inEscape)
                    nextStr += c;
            }
        }

        if(nextStr)
            split.push(nextStr);

        let cmd = module.exports.COMMANDS[split[0].toLowerCase()];

        if(cmd)
        {
            split.shift(); // "split" now represents the command's arguments
            return cmd.run(split);
        }
        else
        {
            module.exports.COMMANDS.help.run();
            return true;
        }
    },
    
    COMMANDS:
    {
        "ping": require('./commands/ping'),
        "stop": require('./commands/stop'),
        "download-song": require('./commands/download-song')
    }
}

module.exports.COMMANDS.help = require('./commands/help')(module.exports.COMMANDS);