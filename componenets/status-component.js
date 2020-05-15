const Component = require('./component');

const PlaylistManager = require('../playlist-manager');

module.exports = class extends Component
{
    constructor(categoryManager)
    {
        super();
        this.categoryManager = categoryManager;
    }

    init(app)
    {        
        app.get('/api/status/', (req, res, next) => this.action(req, res, next));
    }

    action(req, res, next)
    {
        let payload =
        {
            currentCategory: this.categoryManager.category.requestData,
            playlist: this.categoryManager.category.playlist,
            nextCategoryTime: this.categoryManager.nextCategoryTime
        };
    
        res.status(200).type('json').send(JSON.stringify(payload));
    }
}