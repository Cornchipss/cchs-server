const Component = require('./component');

const fs = require('fs');
const Zipper = require('adm-zip');

const { youtubeApi } = require('../secret/credentials.json');
const youtube = new (require('simple-youtube-api'))(youtubeApi);

const SONGS_DIR = __dirname.substr(0, __dirname.lastIndexOf('\\')) + '/songs';

// https://www.npmjs.com/package/youtube-mp3-downloader
const mp3Downloader = new (require('youtube-mp3-downloader'))(
    {
        "ffmpegPath": "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
        "outputPath": SONGS_DIR,
        "youtubeVideoQuality": "lowest",
        "queueParallelism": 2,
        "progressTimeout": 2000
    });

const MAX_SONG_DURATION = 60 * 10; // 10 mins

if(!fs.existsSync(SONGS_DIR))
    fs.mkdirSync(SONGS_DIR); // the youtube downloader won't auto make this directory

module.exports = class extends Component
{
    init(app)
    {
        app.post('/api/song', (req, res, next) => this.action(req, res, next));

        this._que = [];
    }

    /**
     * Makes it so users can request multiple songs at once and the server doesn't send the wrong songs
     * This is just a helper method, so don't call this directly - call doSong() instead
     */
    _doNextSong()
    {
        if(this._que.length === 0)
            return;

        let current = this._que[0];

        mp3Downloader.download(current.id, current.title + '.mp3');

        mp3Downloader.once('finished', (err, data) =>
        {
            if(err)
            {
                console.log(err);
                current.res.status(500).send("sorry, but the server encountered an error parsing this song :(");
            }
            else
            {
                current.res.sendFile(data.file, err =>
                {
                    let zipper = new Zipper(SONGS_DIR + '/songs.zip');
                    zipper.addLocalFile(data.file);
                    zipper.writeZip();

                    fs.unlink(data.file, () => {});
                });
            }
            this._que.splice(0, 1); // removes the one we just did
            this._doNextSong();
        });

        mp3Downloader.once('error', (err) =>
        {
            console.log(err);
            current.res.status(500).send("sorry, but the server encountered an error parsing this song :(");
            this._que.splice(0, 1); // removes the one we just did
            this._doNextSong();
        });
    }

    /**
     * 
     * @param {string} id Id of the video
     * @param {string} title Title of the video
     * @param {object} res The response to send the data to
     */
    doSong(id, title, res)
    {
        this._que.push({id: id, title: title, res: res});

        if(this._que.length === 1)
        {
            this._doNextSong();
        }
    }

    action(req, res, next)
    {
        let name = req.body['name'];

        const VID_AMT = 5;

        youtube.searchVideos(name, VID_AMT).then(async videos =>
        {
            /*
             * Possible improvement:
             * Instead of selecting the first one, send back all of them to the client
             * then ask which they prefer, and use a different request to handle that
             */
            let vidIndex;

            // Selects the first video that's under the MAX_SONG_DURATION
            for(vidIndex = 0; vidIndex < VID_AMT; vidIndex++)
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
                res.status(400).send('Video length cannot be over ' + MAX_SONG_DURATION + ' seconds.');
                return;
            }

            // Makes the title ffmpeg-able
            let video = videos[vidIndex];
            let title = video.title.split('|').join('-'); // The '|' character likes to break ffmpeg, so I replace it with a '-' instead

            let songPath = `${SONGS_DIR}/${title}.mp3`;

            fs.exists(songPath, exists =>
            {
                if(exists)
                {
                    res.sendFile(songPath);
                    console.log('existed, file sent.');
                }
                else
                {
                    let found = false;
                    let zipper = new Zipper(SONGS_DIR + '/songs.zip');
                    zipper.getEntries().forEach(entry =>
                    {
                        if(entry.name === title + '.mp3')
                        {
                            found = true;

                            // Temp extracts it to send it, then deletes the extracted file

                            zipper.extractEntryTo(entry.name, SONGS_DIR, true, true);
                            res.status(200).sendFile(songPath, err =>
                            {
                                fs.unlink(songPath, () => {});
                            });
                            return;
                        }
                    });
                    
                    if(!found)
                        this.doSong(video.id, title, res);
                }
            });
        }).catch(err =>
        {
            console.log(err);
            res.status(500).send(err);
        });
    }
}