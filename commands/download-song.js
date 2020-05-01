const SongHandler = require('../song-handler');

module.exports = 
{
    run: (args) =>
    {
        if(args && args.length !== 0)
        {
            let songName = args.join(' ');
            console.log('Searching ' + songName);
            SongHandler.getVideoByName(songName, 5, (err, video) =>
            {
                if(err)
                    console.log(err);
                else
                {
                    SongHandler.songExists(video.title, (exists) =>
                    {
                        if(exists)
                        {
                            console.log('Song already exists!');
                        }
                        else
                        {
                            console.log('Downloading ' + video.title + '...');
                            SongHandler.downloadSong(video.id, video.title, (err, fname) =>
                            {
                                if(!err)
                                    console.log('Song downloaded!');
                            });
                        }
                    });
                }
            });
        }
        else
        {
            console.log('Must specify a song name!');
        }
        return true;
    },

    description: () =>
    {
        return 'Caches the given song';
    },

    arguments: () =>
    {
        return '<song name>'
    }
}