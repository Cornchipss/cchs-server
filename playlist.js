const fs = require('fs');

const SongHandler = require('./song-handler');

const FOLDER = __dirname + '/playlists/';

if(!fs.existsSync(FOLDER))
{
    fs.mkdirSync(FOLDER);
}

module.exports = class
{
    constructor(name)
    {
        this.name = name;
        this.songs = [];

        if(fs.existsSync(FOLDER + name + '.json'))
        {
            fs.readFile(FOLDER + name + '.json', {encoding: 'utf-8'}, (err, res) =>
            {
                if(err) 
                    throw err;
                this.songs = JSON.parse(res);
            });
        }
    }

    save(callback)
    {
        fs.writeFile(
            JSON.stringify(this.songs), 
            FOLDER + this.name + '.json', 
            () => { if(callback) callback(); });
    }

    addSong(song)
    {
        this.songs.push(song);
    }

    removeSong(song)
    {
        for(let i = 0; i < this.songs.length; i++)
        {
            if(this.songs[i] === song)
            {
                this.songs.splice(i, 1);
                break;
            }
        }
    }

    getSong(songName)
    {
        for(let i = 0; i < this.songs.length; i++)
        {
            if(this.songs[i] === songName)
            {
                return this.getSong(i);
            }
        }

        return undefined;
    }

    getSong(i, callback)
    {
        let song = this.songs[i];

        SongHandler.getSong(5, song, (err, song, finish) =>
        {
            if(err)
            {
                callback(err, song);
            }
            else
            {
                callback(undefined, song, finish);
            }
        });

        // Goes ahead and caches the next song - theres a good chance it will be played next
        let nextSong = this.songs[(i + 1) % this.songs.length];
        SongHandler.getVideoByName(nextSong, 5, (err, name) =>
        {
            if(err)
            {
                console.log(err);
                return;
            }
            SongHandler.downloadSong(5, name);
        });
    }
}