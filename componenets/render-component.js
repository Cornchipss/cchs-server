const Component = require('./component');
const markdownIt = require('markdown-it');
let md = new markdownIt();
md.use(require('markdown-it-emoji'));
md.use(require('markdown-it-latex').default);
md.use(require('markdown-it-highlightjs'));

const path = require('path');
const fs = require('fs');

module.exports = class extends Component
{
    constructor(categoryManager)
    {
        super();
        this.categoryManager = categoryManager;
    }

    init(app)
    {
        app.get('/api/render/', (req, res, next) => this.action(req, res, next));
        // For handling large payloads
        app.post('/api/render/', (req, res, next) => this.postAction(req, res, next));
    }

    postAction(req, res, next)
    {
        let src = req.body['src'];
        if(src)
        {
            res.status(200).type('html').send(md.render(src));
        }
        else
        {
            res.status(400).type('html').send('');
        }
    }

    action(req, res, next)
    {
        let cat = req.query['category'];
        let page = req.query['page'];

        if(!cat || !page)
        {
            if(this.categoryManager.category)
            {
                cat = this.categoryManager.category.name;
                page = this.categoryManager.category.page;
            }
        }

        let absoluteDir = path.join(__dirname, '..');

        if(!cat || !page)
        {
            res.status(404).sendFile(path.join(absoluteDir, 'public', '404.html'));
            return;
        }

        let pth = path.join(absoluteDir, 'pages', cat, page, 'index.md'); 
        fs.exists(pth, exists =>
        {
            if(exists)
            {
                fs.readFile(pth, {encoding: 'utf8'}, (err, data) =>
                {
                    if(err)
                    {
                        res.status(500).type('json').send(JSON.stringify({error: err}));
                    }
                    else
                    {
                        res.status(200).type('html').send(md.render(data));
                    }
                });
            }
            else
            {
                res.status(404).sendFile(path.join(absoluteDir, 'public', '404.html'));
            }
        });
    }
}