module.exports = 
{
    run: (args) =>
    {
        console.log('>>> pong');
        return true;
    },

    description: () =>
    {
        return 'A test command that says "pong"';
    }
}