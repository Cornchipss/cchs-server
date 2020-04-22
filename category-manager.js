const fs = require('fs');
const Category = require('./category');

const CATEGORY_PATH = __dirname + '/pages/';

module.exports = class
{
    constructor(callback)
    {
        this.init(callback);

        this._currentCategory = 0;
        this._nextCategoryTime = Date.now() + 1000 * 60 * 5; // 5 mins/category temp
    }

    /**
     * Checks the time before updating the category & updates the category
     */
    updateCategories()
    {
        if(Date.now() >= this.nextCategoryTime)
        {
            this.nextCategory();
        }

        if(this.category)
            this.category.update();
    }

    /**
     * Advances the category regardless of time
     */
    nextCategory()
    {
        this._currentCategory = (this._currentCategory + 1) % this._categories.length;
        this._nextCategoryTime = Date.now() + 1000 * 60 * 5; // 5 mins/category temp
    }

    categoryExists(name)
    {
        let ret = false;
        this.categories.forEach(c =>
        {
            if(c.name === name)
                return ret = true;
        });
        return ret;
    }

    getCategory(name)
    {
        let cat = null;
        this.categories.forEach(c =>
        {
            if(c.name === name)
            {
                cat = c;
                return;
            }
        });
        return cat;
    }

    addCategory(cat, order)
    {
        if(!order)
            this.categories.push(cat);
        else
        {
            let newCats = new Array(this.categories.length);
            for(let i = 0; i < order; i++)
            {
                newCats[i] = this.categories[i];
            }
            newCats[order] = cat;
            for(let i = order + 1; i < newCats.length; i++)
            {
                newCats[i] =  this.categories[i - 1];
            }
            this._categories = newCats;
        }
    }

    get categories() { return this._categories; }

    get category() { return this._categories[this.currentCategoryIndex]; }
    get currentCategoryIndex() { return this._currentCategory; }
    get nextCategoryTime() { return this._nextCategoryTime; }

    /**
     * Loads all the categories from the directory
     */
    init(callback)
    {
        this._categories = [];

        if(!fs.existsSync(CATEGORY_PATH))
        {
            fs.mkdirSync(CATEGORY_PATH, {recursive: true});
        }

        fs.readdir(CATEGORY_PATH, (err, files) =>
        {
            if(err)
                throw new Error(err);

            if(files.length === 0)
                callback();
            else
            {
                let done = 0;
                let todo = 0;
                files.forEach(f =>
                {
                    todo++;

                    fs.stat(CATEGORY_PATH + f, (err, stats) => // Used to see if the file is a directory
                    {
                        if(err)
                            throw new Error(err);
                        done++;
                        if(stats.isDirectory())
                        {
                            this._categories.push(new Category(f));
                        }

                        if(done === todo && callback)
                        {
                            callback();
                        }    
                    });
                });
            }
        });
    }
}