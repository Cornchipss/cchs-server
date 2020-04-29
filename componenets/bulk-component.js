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
            currentPage: this.categoryManager.category.page,
            nextCategoryTime: this.categoryManager.nextCategoryTime,
            categories: this.categoryManager.categories,
            timings: this.categoryManager.timings,
            playlist: this.categoryManager.category.playlist
        };
    
        res.status(200).type('json').send(JSON.stringify(payload));
    }
}