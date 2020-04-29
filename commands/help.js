module.exports = (commands) =>
{
    return {
        run: (args) =>
        {
            let printStr = '== Help ==\n';

            Object.keys(commands).forEach(key =>
            {
                let cmd = commands[key];

                if(cmd.arguments)
                    printStr += `${key} ${cmd.arguments()} - ${cmd.description()}\n`;
                else
                    printStr += `${key} - ${cmd.description()}\n`;
            });

            console.log(printStr.substr(0, printStr.length - 1));

            return true;
        },
        description: () =>
        {
            return 'Explains the commands.';
        }
    };
}
