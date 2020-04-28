
const fs = require('fs');
const Zipper = require('adm-zip');

const { youtubeApi } = require('./secret/credentials.json');
const youtube = new (require('simple-youtube-api'))(youtubeApi);

const SONGS_DIR = __dirname + '/songs';

// https://www.npmjs.com/package/youtube-mp3-downloader
const mp3Downloader = new (require('youtube-mp3-downloader'))(
    {
        "ffmpegPath": "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
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
    getSong: (vids, name, callback) =>
    {
        module.exports.getVideoByName(name, vids, (err, video) =>
        {
            if(err)
            {
                callback(err, video); // In this case the "video" variable is an err code
                return;
            }

            let title = video.title.split('|').join('-'); // The '|' character likes to break ffmpeg, so I replace it with a '-' instead

            let songPath = `${SONGS_DIR}/${title}.mp3`;
            
            let existsZipped = false;
            let zipper = new Zipper(SONGS_DIR + '/songs.zip');

            zipper.getEntries().forEach(entry =>
            {
                if(entry.name === title + '.mp3')
                {
                    existsZipped = true;

                    // Temp extracts it to send it, then deletes the extracted file
                    zipper.extractEntryTo(entry.name, SONGS_DIR, true, true);
                    callback(undefined, songPath, () =>
                    {
                        fs.unlink(songPath, () => {});
                    });
                    return;
                }
            });
            
            if(!existsZipped)
                module.exports.downloadSong(video.id, title, callback);
        });        
    },

    // The Youtube to Mp3 library can only handle one song at a time or it breaks, a que is used to prevent breakage
    _que: [],
    downloadSong: (id, title, callback) =>
    {
        module.exports._que.push({id: id, title: title, callback: callback});

        if(module.exports._que.length === 1)
        {
            handleQue();
        }

        // If the que's length isn't 1, it is currently processing another song and will automatically go to this one once it finishes the others in que
    },

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
                callback(undefined, videos[vidIndex]);
                return;
            }
        }).catch(err =>
        {
            console.log(err);
            callback(err, 500);
        });
    },

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
        console.log(err);
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