const bodyParser = require('body-parser');
const express = require('express');

const CategoryManager = require('./category-manager');
const AccountManager = require('./account-manager');

const handleCommand = require('./command-handler');

const app = express();

// Makes express able to understand data given to it from HTML forms
app.use(bodyParser.urlencoded({ extended: true }));

const port = 8675;

const categoryManager = new CategoryManager();
const accountManager = new AccountManager();

// Keeps the current category up to date - kinda jank i know
setInterval(() =>
{
    categoryManager.updateCategories();
}, 100);

// For the command line interface
const readline = require('readline').createInterface(
{
    input: process.stdin,
    output: process.stdout
});

// dbg
app.get('/admin', (req, res, next) =>
{
    console.log('ADMIN PAGE REQUESTED!');
    next();
});

new (require('./componenets/status-component'))(categoryManager).init(app);
new (require('./componenets/bulk-component'))(categoryManager).init(app);
new (require('./componenets/page-component'))(categoryManager).init(app);

new (require('./componenets/login-component'))(accountManager).init(app);
new (require('./componenets/register-component'))(accountManager).init(app);

new (require('./componenets/page-upload-component'))(categoryManager).init(app);

new (require('./componenets/song-component'))().init(app);

app.get('/api', (req, res) =>
{
    res.status(404).type('json').send(JSON.stringify({ error: 'Please specify an API request - docs @ /docs' }));
});

// If this wasnt an api call send them the webpage they requested
app.use('/', express.static(__dirname + '/public', {index: 'index.html'}));

// Last call if page not found - shows a 404 error
app.use((req, res, next) =>
{
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.listen(port, () => 
{
    console.log('Listening on port ' + port);
    (function()
    {
        readline.question('> ', (res) =>
        {
            if(handleCommand(res))
                arguments.callee(); // recalls this anonymous function
            else
            {
                console.log('Exiting...');
                process.exit(0);
            }
        });
    })();
});