const fs = require('fs');

const Playlist = require('./playlist');

module.exports = class
{
    constructor(name, callback)
    {
        this._name = name;
        this.init(name, callback);
    }

    /**
     * Resets the next page time w/out changing the page
     */
    resetClock()
    {
        this._nextPageTime = Date.now() + this.interval;
    }

    /**
     * Advances to the next page
     */
    nextPage()
    {
        this._currentPage = (this._currentPage + 1) % this.pages.length;
        this.resetClock();
    }

    /**
     * Checks if it should advance to the next page, and does so if it should
     */
    update()
    {
        if(Date.now() > this._nextPageTime)
            this.nextPage();
    }

    init(name, callback)
    {
        fs.exists(this.path, exists =>
        {
            if(!exists)
            {
                fs.mkdirSync(this.path, {recursive: true});
            }

            this._pages = [];

            fs.readdir(this.path, (err, files) =>
            {
                if(err)
                {
                    throw new Error(err);
                }

                files.forEach(f =>
                {
                    if(fs.statSync(this.path + f).isDirectory()) // making this sync would be very hard, more trouble than it's worth.
                        this._pages.push(f);
                });

                if(exists) // if it exists there is a config file to read from
                {
                    fs.readFile(this.path + 'settings.json', (err, data) =>
                    {
                        if(err)
                        {
                            throw new Error(err);
                        }
                        
                        let settings = JSON.parse(data);

                        this._name = name;

                        this._currentPage = 0;
                        this.interval = settings.interval;
                        this.resetClock();

                        this._playlist = new Playlist(settings.playlist);
                        this._showTime = settings.showTime;
                        
                        this._playlistMode = settings.mode;

                        if(callback)
                            callback(this);
                    });
                }
                else
                {
                    this._name = name;
                    
                    this._currentPage = 0;
                    this._nextPageTime = Date.now() + 30000;
                    
                    this._playlist = new Playlist('default');
                    this._showTime =
                    [
                        {
                            days: [ 0, 1, 2, 3, 4, 5, 6 ],
                            times: [ "00:00:00" ]
                        }
                    ];
                    
                    this.save();
                    if(callback)
                        callback(this);
                }
            });
        });
    }

    addPage(name, file, order, callback)
    {
        let path = `${this.path}/${name}/index.md`;
        fs.mkdir(path.substr(0, path.lastIndexOf('/')), {recursive: true}, err =>
        {
            if(err)
            {
                if(callback)
                    callback(500, err);
                return;
            }
            
            fs.rename(file.path, path, err =>
            {
                if(err)
                {
                    if(callback)
                        callback(500, err);
                }
                else
                {
                    if(order !== undefined && order !== this.pages.length && order >= 0)
                    {
                        let index = this.pages.indexOf(name);
                        if(index !== order)
                        {
                            if(index !== -1)
                            {
                                this.pages.slice(index, index + 1); // remove that occurence
                            }

                            let newPages = new Array(this.pages.length);
                            for(let i = 0; i < order; i++)
                            {
                                newPages[i] = this.pages[i];
                            }
                            newPages[order] = name;
                            for(let i = order + 1; i < this.newPages.length; i++)
                            {
                                newPages[i] = this.pages[i - 1];
                            }
                            this._pages = newPages;
                        }
                    }
                    else
                    {
                        if(!this.pages.includes(name))
                            this.pages.push(name);
                    }

                    if(callback)
                        callback(200, this);
                }
            });
        });
    }

    save(callback)
    {
        fs.writeFile(this.path + 'settings.json', JSON.stringify({
            interval: this.interval,
            showTime: this.showTime,
            mode: this.playlistMode,
            playlist: this.playlist.name
        }), 
        () => 
        {
            if(callback) callback();
        });
    }

    get path() { return `${__dirname}/pages/${this.name}/`; }

    get showTime() { return this._showTime; }

    get name() { return this._name; }
    get page() { return this.pages[this._currentPage]; }
    get pages() { return this._pages; }

    get playlist() { return this._playlist; }
    set playlist(p) { this._playlist = p; }

    get requestData()
    {
        return {
            name: this.name,
            pages: this.pages,
            currentPage: this._currentPage,
            nextPageTime: this._nextPageTime,
            playlist: this._playlist.name,
            playlistMode: this._playlistMode,
            showTime: this._showTime
        }
    }
}