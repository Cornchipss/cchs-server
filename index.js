// DONT FORGET (lyrics): https://developer.musixmatch.com/documentation/floating-lyrics

const bodyParser = require('body-parser');
const express = require('express');

const DEBUG = require('./DEBUG');

if(DEBUG.IS_DEBUG)
{
    console.log('WARNING: DEBUG MODE IS ACTIVE, SERVER IS HIGHLY INSECURE!');
}

const CategoryManager = require('./category-manager');
const AccountManager = require('./account-manager');

const commandHandler = require('./command-handler');

const session = require('client-sessions');

const { cookieSecret } = require('./secret/credentials.json');

const app = express();

const COOKIE_LIFE = 1000 * 60 * 60 * 24 * 4; // 4 days

app.use(session(
{
    cookieName: 'session',
    secret: cookieSecret,
    duration: COOKIE_LIFE,
    activeDuration: COOKIE_LIFE // extends cookie's lifetime if used before it expires
}));

// Makes express able to understand data given to it from HTML forms
app.use(bodyParser.urlencoded({ extended: true }));

// Makes express able to understand JSON data
app.use(bodyParser.json());

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

app.get('/admin', (req, res, next) =>
{
    accountManager.isRequestLoggedIn(req, loggedIn =>
    {
        if(loggedIn)
        {
            next();
        }
        else
        {
            res.redirect('/login');
        }
    });
});

app.post('/admin', (req, res, next) =>
{
    accountManager.isRequestLoggedIn(req, loggedIn =>
    {
        if(loggedIn)
        {
            next();
        }
        else
        {
            res.status(401).type('json').send(JSON.stringify({error: 'Must be logged in to access /admin'}));
        }
    });
});

new (require('./componenets/status-component'))(categoryManager).init(app);
new (require('./componenets/bulk-component'))(categoryManager).init(app);
new (require('./componenets/page-component'))(categoryManager).init(app);
new (require('./componenets/render-component'))(categoryManager).init(app);

new (require('./componenets/login-component'))(accountManager).init(app);
new (require('./componenets/register-component'))(accountManager).init(app);

new (require('./componenets/page-upload-component'))(categoryManager).init(app);

new (require('./componenets/song-component'))().init(app);

app.use('/api', (req, res) =>
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
            if(commandHandler.handleInput(res))
                arguments.callee(); // recalls this anonymous function
            else
            {
                console.log('Exiting...');
                process.exit(0);
            }
        });
    })();
});