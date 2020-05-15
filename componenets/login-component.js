const Component = require('./component');

module.exports = class extends Component
{
    constructor(accountManager)
    {
        super();
        this.accountManager = accountManager;
    }

    init(app)
    {
        app.post('/login', (req, res, next) => this.action(req, res, next));
    }

    action(req, res, next)
    {
        if(!req.body)
        {
            res.status(400).type('json').send(JSON.stringify({error: 'Must specify username & password or token!'}));
            return;
        }

        let username = req.body['username'];
        let password = req.body['password'];
        let token    = req.body['token'];

        if(token)
        {
            this.accountManager.loginToken(token, (username, err) =>
            {
                if(username)
                {
                    req.session.user = token;
                    res.status(200).type('json').send(JSON.stringify({username: username}));
                }
                else
                {
                    res.status(401).type('json').send(JSON.stringify({error: err}));
                }
            });
        }
        else if(username && password)
        {
            this.accountManager.login(username, password, (token, err) =>
            {
                if(token)
                {
                    req.session.user = token;
                    res.status(200).type('json').send(JSON.stringify({token: token}));
                }
                else
                {
                    res.status(401).type('json').send(JSON.stringify({error: err}));
                }
            });
        }
        else
        {
            res.status(400).type('json').send(JSON.stringify({error: 'Must specify username & password or token!'}));
        }
    }
}