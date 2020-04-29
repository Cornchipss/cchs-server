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
                            SongHandler.downloadSong(video.id, video.title, (err, fname, finish) =>
                            {
                                console.log('Song downloaded!');
                                finish();
                            });
                        }
                    });
                }
            });
            SongHandler.getSong(5, songName, (err, vid) =>
            {

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
        return 'A test command that says "pong"';
    },

    arguments: () =>
    {
        return '<song name>'
    }
}