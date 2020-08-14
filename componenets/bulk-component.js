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
        app.get('/api/bulk', (req, res, next) => this.action(req, res, next));
        app.post('/admin/api/bulk', (req, res, next) => this.actionPost(req, res, next));
    }

    actionPost(req, res, next)
    {
        //this.categoryManager.categories = req.categories;
        this.categoryManager.categories.forEach(cat =>
        {
            
        });
        /*
        PlaylistManager.playlists = req.playlists;
        PlaylistManager.saveAll();

        if(req.nameChanges)
        {
            Object.keys(req.nameChanges).forEach(change => 
            {
                for(let i = 0; i < this.categoryManager.categories.length; i++)
                {
                    if(this.categoryManager.categories[i].name === change)
                    {
                        this.categoryManager.categories[i].name = req.nameChanges[change];
                    }
                }
            });
        }

        this.categoryManager.
*/
        console.log(req.body);
        res.status(200).type('json').send('{"eso": "xd"}');
    }

    action(req, res, next)
    {
        let payload = 
        {
            currentCategory: this.categoryManager.currentCategoryIndex,
            nextCategoryTime: this.categoryManager.nextCategoryTime,
            categories: this.categoryManager.categoriesData,
            playlists: PlaylistManager.playlists
        };
    
        res.status(200).type('json').send(JSON.stringify(payload));
    }
}