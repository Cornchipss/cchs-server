const SongHandler = require('./song-handler');

module.exports = class
{
    /**
     * A generic list of song names read from a json file that manages the caching of songs.
     * @param {string} name The name of the playlist
     */
    constructor(name, playlistManager)
    {
        this.name = name;
        this.songs = [];

        this.playlistManager = playlistManager;

        this.songs = this.playlistManager.playlists[name];
    }

    /**
     * Saves the playlist to its JSON file
     * @param {Function} callback () - Called when it finishes saving
     */
    save(callback)
    {
        this.playlistManager.save(this.name, this.songs, callback);
    }

    /**
     * Adds a song
     * @param {string} song The song's exact name
     */
    addSong(song)
    {
        this.songs.push(song);
        this.save();
    }

    /**
     * Removes a song
     * @param {string} song The song's exact name
     */
    removeSong(song)
    {
        for(let i = 0; i < this.songs.length; i++)
        {
            if(this.songs[i] === song)
            {
                this.songs.splice(i, 1);
                this.save();
                break;
            }
        }
    }

    /**
     * 
     * @param {number} i The song's index
     * @param {Function} callback (err?, song, finish?) - Call finish once you're done using the song
     * @param {number} nextIndex If provided, the song at this index will be cached, but nothing else done with it.
     */
    getSong(i, callback, nextIndex)
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

        if(nextIndex)
        {
            // Goes ahead and caches the next song so we dont have to wait for it to be downloaded before its played
            let nextSong = this.songs[nextIndex];
            SongHandler.getVideoByName(nextSong, 5, (err, video) =>
            {
                if(err)
                {
                    console.log(err);
                    return;
                }

                SongHandler.songExists(video.title, (exists) =>
                {
                    if(!exists)
                    {
                        SongHandler.downloadSong(5, nextSong);
                    }
                })
            });
        }
    }

    /**
     * Returns the amount of songs
     * @returns the amount of songs
     */
    get size() { return this.songs.length; }
}