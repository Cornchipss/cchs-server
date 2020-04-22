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
        app.post('/register', (req, res, next) => this.action(req, res, next));
    }

    action(req, res, next)
    {
        if(!req.body)
        {
            res.status(400).type('json').send(JSON.stringify({error: 'Must specify username, password, authoriazation username, and authorization password!'}));
            return;
        }

        let username = req.body['username'];
        let password = req.body['password'];
        let authUser = req.body['authUsername'];
        let authPass = req.body['authPassword'];

        if(!username || !password || !authUser || !authPass)
        {
            res.status(400).type('json').send(JSON.stringify({error: 'Must specify username, password, authoriazation username, and authorization password!'}));
            return;
        }

        this.accountManager.register(username, password, authUser, authPass, (token, err) =>
        {
            if(token)
            {
                res.status(200).type('json').send(JSON.stringify({token: token}));
            }
            else
            {
                res.status(401).type('json').send(JSON.stringify({error: err}));
            }
        });
    }
}