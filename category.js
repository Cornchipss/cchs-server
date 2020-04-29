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
        this._nextPageTime = Date.now() + this._settings.interval;
    }

    /**
     * Advances to the next page
     */
    nextPage()
    {
        this._currentPage = (this._currentPage + 1) % this.pages.length;
        this._nextPageTime = Date.now() + this._settings.interval;
    }

    nextSong()
    {
        let i = _songIndicies.pop();
        if(this._songIndicies.length === 0)
        {
            this.orderSongs();
        }
        this._playlist.getSong(i, (err, song, finish) =>
        {
            if(err)
            {
                console.log(err);
            }
        }, this._songIndicies[this._songIndicies.length - 1]);
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

                        this._settings = JSON.parse(data);

                        this._name = name;

                        this._currentPage = 0;
                        this._nextPageTime = Date.now() + this._settings.interval;

                        this._playlist = new Playlist(this._settings.playlist);
                        let showtimeSplit = this._settings.showTime.split(':');
                        this._displayTime = 
                        {
                            hour: Number(showtimeSplit[0]),
                            minute: Number(showtimeSplit[1]),
                            second: Number(showtimeSplit[2])
                        };

                        this._mode = this._settings.mode;

                        this.orderSongs();

                        if(callback)
                            callback(this);
                    });
                }
                else
                {
                    this._settings = {interval: 30000, playlist: 'default', start: '00:00:00'};
                    this._name = name;
                    
                    this._currentPage = 0;
                    this._nextPageTime = Date.now() + this._settings.interval;
                    
                    this._playlist = new Playlist('default');
                    this._displayTime = {hour: 0, minute: 0, second: 0};
                    
                    this.save();
                    if(callback)
                        callback(this);
                }
            });
        });
    }

    orderSongs()
    {
        this._songIndicies = new Array(this._playlist.size());
        for(let i = 0; i < this._songIndicies; i++)
        {
            this._songIndicies[this._songIndicies - 1 - i] = i; // Fills the array backwards (3, 2, 1, 0 instead of 0, 1, 2, 3)
            // Its filled backwards so I can remove the last element to get the next song, which is way more efficient than removing the first element
        }

        if(this._mode === 'shuffle')
        {
            for(let i = 0; i < this._songIndicies; i++)
            {
                let temp = this._songIndicies[i];
                let randomIndex = Math.floor(Math.random() * this._songIndicies.length);
                this._songIndicies[i] = this._songIndicies[randomIndex];
                this._songIndicies[randomIndex] = temp;
            }
        }
    }

    addPage(name, file, order, callback)
    {
        let path = `${this.path}/${name}/index.html`;
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
        fs.writeFile(this.path + 'settings.json', JSON.stringify(this.settings), 
        () => 
        {
            if(callback) callback();
        });
    }

    get path() { return `${__dirname}/pages/${this.name}/`; }

    get name() { return this._name; }
    get page() { return this.pages[this._currentPage]; }
    get settings() { return this._settings; }
    get pages() { return this._pages; }

    get playlist() { return this._playlist; }
    set playlist(p) { this._playlist = p; }
}