const Component = require('./component');
const Category = require('../category');

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
        this.categoryManager.pause = true;

        let data = req.body;

        let addLeftoverCats = () =>
        {
            let started = 0;
            data.categories.forEach(c =>
            {
                started++;
                let cat = new Category(c.name, this.categoryManager.playlistManager);
                cat.interval = c.interval;
                cat.playlist = c.playlist;
                cat.playlistMode = c.playlistMode;
                cat.showTime = c.showTime;
    
                cat.save(() =>
                {
                    started--;
                    this.categoryManager.addCategory(cat);

                    if(started === 0)
                        this.categoryManager.pause = false;
                });
            });

            if(started === 0)
                this.categoryManager.pause = false;
        }

        this.categoryManager.categories.forEach(cat =>
        {
            let found = false;

            let processing = 0;

            for(let i = 0; i < data.categories.length; i++)
            {
                let c = data.categories[i];

                processing++;

                if(c.name === cat.name)
                {
                    found = true;
                    cat.interval = c.interval;
                    cat.playlist = c.playlist;
                    cat.playlistMode = c.playlistMode;
                    cat.showTime = c.showTime;
                    cat.removeMissingPages(c.pages);

                    if(data.nameChanges && data.nameChanges[cat.name])
                    {
                        cat.name = data.nameChanges[cat.name];
                    }

                    cat.save(() =>
                    {
                        processing--;

                        if(processing === 0)
                        {
                            //this.categoryManager.reinit();
                            addLeftoverCats();
                        }
                    });

                    data.categories.splice(i, 1);
                    return;
                }
            };

            if(!found)
            {
                this.categoryManager.removeCategory(cat.name);

                processing--;

                if(processing === 0)
                {
                    //this.categoryManager.reinit();
                    addLeftoverCats();
                }
            }
        });

        this.categoryManager.playlistManager.playlists = data.playlists;
        this.categoryManager.playlistManager.saveAll();

        res.status(200).type('json').send('{"success": "true"}');
    }

    action(req, res, next)
    {
        let payload = 
        {
            currentCategory: this.categoryManager.currentCategoryIndex,
            nextCategoryTime: this.categoryManager.nextCategoryTime,
            categories: this.categoryManager.categoriesData,
            playlists: this.categoryManager.playlistManager.playlists
        };
    
        res.status(200).type('json').send(JSON.stringify(payload));
    }
}