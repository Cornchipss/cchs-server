const Component = require('./component');

module.exports = class extends Component
{
    constructor(categoryManager)
    {
        super();
        this.categoryManager = categoryManager;
    }

    init(app)
    {
        app.get('/api/bulk', (req, res, next) => this.action(req, res, next));
    }

    action(req, res, next)
    {
        let payload = 
        {
            currentCategory: this.categoryManager.currentCategoryIndex,
            nextCategoryTime: this.categoryManager.nextCategoryTime,
            categories: this.categoryManager.categoriesData,
            playlists: this.categoryManager.category.playlist
        };
    
        res.status(200).type('json').send(JSON.stringify(payload));
    }
}