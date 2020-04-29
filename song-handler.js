
const fs = require('fs');
const Zipper = require('adm-zip');

const { youtubeApi } = require('./secret/credentials.json');
const youtube = new (require('simple-youtube-api'))(youtubeApi);

const {ffmpegPath} = require('./system-config.json');

const SONGS_DIR = __dirname + '/songs';

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
     * @param callback {Function} (error?, songpath, finish?) Called when this gets the song, or throws an error - If it successfully gets a song, make sure to call finish() to delete any excess files after using the song's uncompressed file.
     */
    getSong: (vids, name, callback) =>
    {
        module.exports.getVideoByName(name, vids, (err, video) =>
        {
            if(err)
            {
                console.error(err);
                callback(err, video); // In this case the "video" variable is an err code
                return;
            }

            let existsZipped = false;
            let zipper = new Zipper(SONGS_DIR + '/songs.zip');

            zipper.getEntries().forEach(entry =>
            {
                if(entry.name === video.title + '.mp3')
                {
                    existsZipped = true;

                    // Temp extracts it to send it, then deletes the extracted file
                    zipper.extractEntryTo(entry.name, SONGS_DIR, true, true);
                    callback(undefined, SONGS_DIR + '/' + entry.name, () =>
                    {
                        fs.unlink(SONGS_DIR + '/' + entry.name, () => {});
                    });
                    return;
                }
            });
            
            if(!existsZipped)
                module.exports.downloadSong(video.id, video.title, callback);
        });        
    },

    // The Youtube to Mp3 library can only handle one song at a time or it breaks, a que is used to prevent breakage
    _que: [],

    /**
     * Downloads a song even if it already exists - will overwrite something that does exist
     * @param id {string} Base64 ID of the youtube video
     * @param title {string} Title to save the video under - should be the same as returned by the getVideoByName function
     * @param callback {Function} (error?, file, finish?) Called once the song has been downloaded - If no error is present call finish once you are done using the downloaded file.
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
                let vid = await youtube.getVideoByID(videos[vidIndex].id);
                if(vid.durationSeconds < MAX_SONG_DURATION)
                {
                    break;
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
                // Replaces all characters that may break file names w/ substitues
                title = title.split(':').join('-').split('"').join('\'').split('/').join('-').split('\\').join('-').split('[').join('(').split(']').join(')').split(';').join('.').split('|').join('-').split(',').join(' ');

                video.title = title; // prob not the best to set this, but it makes my life way easier
                callback(undefined, video);
                return;
            }
        }).catch(err =>
        {
            console.log(err);
            callback(err, 500);
        });
    },

    /**
     * Checks if a song with a given name exists
     * @param name {string} The song's actual name - not user friendly one
     * @param callback {Function} (exists) - If the song does exist
     */
    songExists: (name, callback) =>
    {
        let found = false;
        let zipper = new Zipper(SONGS_DIR + '/songs.zip');
        zipper.getEntries().forEach(entry =>
        {
            if(entry.name === name + '.mp3')
            {
                found = true;
                return;
            }
        });
        callback(found);
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

    mp3Downloader.download(que[0].id, que[0].title + '.mp3');
}

mp3Downloader.on('finished', (err, data) =>
{
    let current = module.exports._que[0];

    if(err)
    {
        console.error(err);
        if(current.callback)
            current.callback("Sorry, but the server encountered an error parsing this song :(");
    }
    else
    {
        function localCopy()
        {
            // Creates a local copy of this song so we don't have to download it again
            let zipper = new Zipper(SONGS_DIR + '/songs.zip');
            zipper.addLocalFile(data.file);
            zipper.writeZip();

            fs.unlink(data.file, () => {});
        }

        if(current.callback)
            current.callback(undefined, data.file, () =>
            {
                localCopy();
            });
        else
            localCopy();
    }

    module.exports._que.splice(0, 1); // removes the one we just did
    handleQue();
});

mp3Downloader.on('error', (err) =>
{
    let current = module.exports._que[0];

    console.log(err);
    current.callback("Sorry, but the server encountered an error parsing this song :(", 500);
    module.exports._que.splice(0, 1); // removes the one we just did
    handleQue();
});