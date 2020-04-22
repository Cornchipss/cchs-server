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
        app.get('/api/status/', (req, res, next) => this.action(req, res, next));
    }

    action(req, res, next)
    {
        let payload =
        {
            currentCategory: this.categoryManager.category,
            currentPage: this.categoryManager.category.page,
            nextCategoryTime: this.categoryManager.nextCategoryTime
        };
    
        res.status(200).type('json').send(JSON.stringify(payload));
    }
}