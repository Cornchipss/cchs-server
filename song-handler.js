const fs = require('fs');
const rimraf = require('rimraf');

const { youtubeApi } = require('./secret/credentials.json');
const youtube = new (require('simple-youtube-api'))(youtubeApi);

const {ffmpegPath} = require('./system-config.json');

const path = require('path');

const SONGS_DIR = path.join(__dirname, './songs');

// https://www.npmjs.com/package/youtube-mp3-downloader
const mp3Downloader = new (require('youtube-mp3-downloader'))(
    {
        "ffmpegPath": ffmpegPath,
        "outputPath": SONGS_DIR,
        "youtubeVideoQuality": "lowest", // This only affects video, not sound
        "queueParallelism": 2,
        "progressTimeout": 2000
    });

const MAX_SONG_DURATION = 60 * 10; // 10 mins

if(!fs.existsSync(SONGS_DIR))
    fs.mkdirSync(SONGS_DIR); // the youtube downloader won't auto make this directory

module.exports =
{
    /**
     * @param vids {number} The amount of videos to search through
     * @param name {string} The name of the video (performs a youtube search to find actual name using this)
     * @param callback {Function} (error?, songpath) Called when this gets the song, or throws an error
     */
    getSong: (vids, name, callback) =>
    {
        module.exports.songExists(name, (exists) => 
        {
            if(exists)
            {
                callback(undefined, exists)
            }
            else
            {
                module.exports.getVideoByName(name, vids, (err, video) =>
                {
                    if(err)
                    {
                        console.error(err);
                        callback(err, video); // In this case the "video" variable is an err code
                        return;
                    }

                    module.exports.getSongId(video.id, callback);
                });
            }
        });
    },

    getSongId: (id, callback) =>
    {
        if(id)
        {
            if(id.length === "dQw4w9WgXcQ".length)
            {
                module.exports.songExistsId(id, (exists) =>
                {
                    if(exists)
                        callback(undefined, exists);
                    else
                    {
                        youtube.getVideoByID(id).then(video =>
                        {
                            module.exports.downloadSong(id, video.title, callback);
                        });
                    }
                });
            }
            else
            {
                callback('ID is an invalid length.', 400);
            }
        }
        else
        {
            callback('ID cannot be undefined.', 400);
        }
    },

    getSongInfo: (id, callback) =>
    {
        if(id)
        {
            fs.readFile(path.join(SONGS_DIR, id, 'details.json'), {encoding: 'utf8'}, (err, res) =>
            {
                if(err)
                {
                    youtube.getVideoByID(id).then(video =>
                    {
                        callback(undefined, {name: video.title});
                    }).catch(err =>
                    {
                        callback('Song with an ID of ' + id + ' was not found.', 400);
                    });
                }
                else
                {
                    callback(undefined, JSON.parse(res));
                }
            });
        }
        else
        {
            callback('An ID must be provided.', 400);
        }
    },

    // The Youtube to Mp3 library can only handle one song at a time or it breaks, a que is used to prevent breakage
    _que: [],

    /**
     * Downloads a song even if it already exists - will overwrite something that does exist
     * @param id {string} Base64 ID of the youtube video
     * @param title {string} Title to save the video under - should be the same as returned by the getVideoByName function
     * @param callback {Function} (error?, file) Called once the song has been downloaded
     */
    downloadSong: (id, title, callback) =>
    {
        module.exports._que.push({id: id, title: title, callback: callback});

        if(module.exports._que.length === 1)
        {
            handleQue();
        }

        // If the que's length isn't 1, it is currently processing another song and will automatically go to this one once it finishes the others in que
    },

    /**
     * Gets a video from a more user friendly name (performs a youtube search and finds the first video under 10 minutes)
     * @param name {string} The user-friendly name of the video
     * @param vids {number} The # of videos to search through until giving up
     * @parma callback {Function} (err?, video) - video has 2 essential properties: title & id (and other less important bonus properties)
     */
    getVideoByName: (name, vids, callback) =>
    {
        youtube.searchVideos(name, vids).then(async videos =>
        {
            /*
             * Possible improvement:
             * Instead of selecting the first one, send back all of them to the client
             * then ask which they prefer, and use a different request to handle that
             */
            let vidIndex;

            // Selects the first video that's under the MAX_SONG_DURATION
            for(vidIndex = 0; vidIndex < vids; vidIndex++)
            {
                if(videos[vidIndex])
                {
                    let vid = await youtube.getVideoByID(videos[vidIndex].id);
                    if(vid.durationSeconds < MAX_SONG_DURATION)
                    {
                        break;
                    }
                }
            }

            // No song was found under this duration
            if(vidIndex === videos.length)
            {
                callback('Video length cannot be over ' + MAX_SONG_DURATION + ' seconds.', 400);
                return;
            }
            else
            {
                let video = videos[vidIndex];
                let title = video.title;
                
                title = title.split('&#39;').join('\''); // ' gets renamed to '&#39;', so I go ahead and fix it.

                video.title = title; // prob not the best to set this, but it makes my life way easier
                callback(undefined, video);
                return;
            }
        }).catch(err =>
        {
            console.error(err);
            callback(err, 500);
        });
    },

    songExistsId: (id, callback) =>
    {
        let pth = path.join(SONGS_DIR, id, 'song.mp3');
        fs.stat(pth, err =>
        {
            if(!err)
                callback(pth);
            else
            {
                callback(undefined);
            }
        });
    },

    /**
     * Checks if a song with a given name exists
     * @param name {string} The song's actual name - not user friendly one
     * @param callback {Function} (exists) - The path to the song if it exists, otherwise undefined
     */
    songExists: (name, callback) =>
    {
        let found = false;

        const dirs = fs.readdirSync(SONGS_DIR).filter(f => fs.statSync(SONGS_DIR + '/' + f).isDirectory());

        dirs.forEach(dir =>
        {
            let pth = path.join(dir, 'details.json');
            if(fs.existsSync(pth))
            {
                let data = fs.readFileSync(pth, {encoding: 'utf8'})
                if(JSON.parse(data).name === name)
                {
                    callback(path.join(dir, 'song.mp3'));
                    found = true;
                    return;
                }
            }
        });

        if(!found)
            callback(undefined);
    }
}

/**
 * Private function, do not call unless you know what you're doing.
 * Downloads the next song in the que
 */
function handleQue()
{
    let que = module.exports._que;

    if(que.length === 0)
        return; // We're done processing :)

    let callbacks = [que[0].callback];

    for(let i = 1; i < que.length; i++)
    {
        // Removes any duplicate downloads, but keep their callbacks
        if(que[i].id === que[0].id)
        {
            callbacks.push(que.splice(i, 1)[0].callback);
        }
    }

    que[0].callback = callbacks;

    let dir = path.join(SONGS_DIR, que[0].id);

    rimraf(dir, () => // removes any failed attempt(s) to download this song
    {
        fs.mkdirSync(dir);
          
        mp3Downloader.download(que[0].id, que[0].id + '.mp3');
    });
}

mp3Downloader.on('finished', (err, data) =>
{
    let current = module.exports._que[0];

    if(err)
    {
        console.error(err);
        current.callback.forEach(callback =>
        {
            if(callback)
                callback("Sorry, but the server encountered an error parsing this song :(");
        });
    }
    else
    {
        let newDir = path.join(SONGS_DIR, current.id);
        let newFile = path.join(newDir, 'song.mp3');
        fs.rename(data.file, newFile, () =>
        {
            fs.writeFile(path.join(newDir, 'details.json'), JSON.stringify({name: current.title}), () =>
            {
                current.callback.forEach(callback =>
                {
                    if(callback)
                        callback(undefined, newFile);
                });
            });
        });
    }

    module.exports._que.splice(0, 1); // removes the one we just did
    handleQue();
});

mp3Downloader.on('error', (err) =>
{
    let current = module.exports._que[0];

    console.error(err);
    current.callback("Sorry, but the server encountered an error parsing this song :(", 500);
    module.exports._que.splice(0, 1); // removes the one we just did
    handleQue();
});