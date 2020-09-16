const fs = require('fs');
const path = require('path');
const songHandler = require('./song-handler');
const rimraf = require('rimraf');

const FOLDER = path.normalize('./playlists/');

module.exports = class
{
    constructor()
    {
        this._loadSongs();
    }

    _loadSongs()
    {
        this.playlists = {};

        if(!fs.existsSync(FOLDER))
            fs.mkdirSync(FOLDER);

        fs.readdir(FOLDER, (err, files) =>
        {
            if(err)
                throw new Error(err);

            files.forEach(f =>
            {
                fs.readFile(path.join(FOLDER, f), 'utf8', (err, data) =>
                {
                    if(err)
                        throw new Error(err);
                    
                    let name = path.parse(f).name;
                    this.playlists[name] = {};
                    this.playlists[name].ids = JSON.parse(data);
                    this.playlists[name].names = [];

                    let ids = this.playlists[name].ids;

                    for(let i = 0; i < ids.length; i++)
                    {
                        songHandler.getSongInfo(this.playlists[name].ids[i], (err, info) =>
                        {
                            this.playlists[name].names[i] = info.name;
                        });
                    }
                });
            });
        });
    }

    save(name, songs, callback)
    {
        fs.writeFile(path.join(FOLDER, `${name}.json`),
            JSON.stringify(songs),
            () => 
            { 
                this._loadSongs(); // reloads the new songs into memory

                if(callback) 
                    callback(); 
            });
    }

    saveAll()
    {
        if(!this.playlists['default'])
            this.playlists['default'] = {ids:[], names:[]};

        rimraf(FOLDER, () =>
        {
            fs.mkdir(FOLDER, () =>
            {
                Object.keys(this.playlists).forEach(p =>
                {
                    this.save(p, this.playlists[p].ids);
                });
            })
        });
    }
}

