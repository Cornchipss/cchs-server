const Component = require('./component');
const fs = require('fs');
const path = require('path');

module.exports = class extends Component
{
    constructor(categoryManager)
    {
        super();
        this.categoryManager = categoryManager;
    }

    init(app)
    {
        app.get('/api/page/', (req, res, next) => this.action(req, res, next));
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

        let path = path.join(absoluteDir, 'pages', cat, page, 'index.md'); 
        fs.exists(path, exists =>
        {
            if(exists)
            {
                res.status(200).type('text').sendFile(path);
            }
            else
            {
                res.status(404).sendFile(path.join(absoluteDir, 'public', '404.html'));
            }
        });
    }
}