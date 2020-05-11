const fs = require('fs');
const Category = require('./category');

const CATEGORY_PATH = __dirname + '/pages/';

module.exports = class
{
    constructor(callback)
    {
        this.init(callback);
    }

    /**
     * Checks the time before updating the category & updates the category
     */
    updateCategories()
    {
        if(this.category)
        {
            if(Date.now() >= this.nextCategoryTime)
            {
                this.nextCategory();
            }

            this.category.update();
        }
    }

    nextCategory()
    {
        if(this.order[this._orderIndex.day].length === 0)
            return; // there are no categories

        this._orderIndex.index++;
        while(this._orderIndex.index === this.order[this._orderIndex.day].length)
        {
            this._orderIndex.index = 0;
            this._orderIndex.day = (this._orderIndex.day + 1) % 7;
        }
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

    // A nice way of representing these easily for comparisons
    _encodeTime(time)
    {
        return time[2] + 100 * (time[1] + 100 * (time[0]));
    }

    addCategory(cat)
    {
        this._categories.push(cat);

        for(let day = 0; day < 7; day++)
        {
            let times = [];
            
            // Adds all the times displayed on this day

            if(cat.showTime[day])
            {
                cat.showTime[day].forEach(time => 
                    {
                        let split = time.split(':');
                        times.push([ Number(split[0]), Number(split[1]), Number(split[2]) ]);
                    });
            }

            if(cat.showTime['*'])
                cat.showTime['*'].forEach(time => 
                    {
                        let split = time.split(':');
                        times.push([ Number(split[0]), Number(split[1]), Number(split[2]) ]);
                    });

            let place = this.order[day];

            let added = 0;

            for(let i = 0; i < place.length; i++)
            {
                let timeHere = place[i].time;

                let cuantifiedTime = this._encodeTime(timeHere);

                for(let j = 0; j < times.length; j++)
                {
                    if(cuantifiedTime > this._encodeTime(times[j]))
                    {
                        place.splice(i, 0, {time: times[j], category: cat});
                        added++;
                    }
                }

                if(added === times.length)
                    break;
            }

            if(added !== times.length)
            {
                times.sort((a, b) =>
                {
                    return this._encodeTime(a) - this._encodeTime(b);
                });

                while(times.length)
                {
                    place.push({ time: times.pop(), category: cat });
                }
            }
        }
    }

    get categories() { return this._categories; }
    get categoriesData()
    {
        let data = new Array(this._categories.length);
        for(let i = 0; i < data.length; i++)
        {
            data[i] = this._categories[i].requestData;
        }
        return data;
    }

    get category()
    {
        if(!this._orderIndex)
            return undefined;
        return this.order[this._orderIndex.day][this._orderIndex.index].category;
    }
    get nextCategoryTime()
    {
        let day = this._orderIndex.day;
        let i = this._orderIndex.index + 1;
        
        // Makes sure the program doesnt get stuck in an infinite while loop if there are no categories to display
        let iterations = 0;
        while(this.order[day].length === i && iterations <= 7) // <= 7 because if no categories were found for any other day, I want to loop back around to the current day and select from there
        {
            day++;
            i = 0;

            iterations++;
        }

        if(iterations === 8)
            return undefined;
        let timeToShow = this.order[day][i].time;

        let show = new Date();
        show.setDate(show.getDate() + iterations);
        show.setHours(timeToShow[0], timeToShow[1], timeToShow[2], 0);
        return show;
    }

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

            this.order = new Array(7);
            for(let i = 0; i < 7; i++)
                this.order[i] = [];

            if(files.length === 0)
            {
                callback();
            }
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

                        if(stats.isDirectory())
                        {
                            let cat = new Category(f, () =>
                            {
                                done++;

                                this.addCategory(cat);

                                if(done === todo)
                                {
                                    // All categories were added, now let's figure out which goes first
                                    this._orderIndex = undefined;

                                    let now = new Date();

                                    let today = now.getDay();
                                    let hr = now.getHours();
                                    let min = now.getMinutes();
                                    let sec = now.getSeconds();

                                    let timeNow = this._encodeTime([hr, min, sec]);

                                    let todayOrder = this.order[today];
                                    if(todayOrder)
                                    {
                                        for(let i = todayOrder.length - 1; i >= 0; i--)
                                        {
                                            let time = todayOrder[i].time;

                                            if(this._encodeTime(time) < timeNow)
                                            {
                                                this._orderIndex = {day: today, index: i};
                                                break;
                                            }
                                        }
                                    }

                                    if(!this._orderIndex)
                                    {
                                        for(let dDay = -1; dDay >= -7; dDay--) // >= -7 because if no categories are in any other day I want to loop back to the today and select from there
                                        {
                                            let day = dDay + today;
                                            if(day < 0)
                                                day += 7;

                                            let here = this.order[day];

                                            // If none are ready to show today, the last one to show yesterday is the one to still show today.
                                            if(here && here.length !== 0)
                                            {
                                                this._orderIndex = {day: day, index: here.length - 1};
                                            }
                                        }
                                    }

                                    if(callback)
                                        callback();
                                }
                            });
                        }
                    });
                });
            }
        });
    }
}