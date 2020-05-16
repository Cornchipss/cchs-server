window.addEventListener('DOMContentLoaded', () =>
{
    const SONG_NOTIFICATION_TIME = 5; // in seconds
    const SONG_FADE_TIME = 2; // in seconds
    
    let firstRun = true;
    let songOrder = [];
    
    function reorderSongs(len, mode)
    {
        songOrder = new Array(len);
        for(let i = 0; i < len; i++)
        {
            songOrder[len - 1 - i] = i;
        }
    
        if(mode === 'shuffle')
        {            
            for(let i = 0; i < len; i++)
            {
                let temp = songOrder[i];
                let randomIndex = Math.floor(Math.random() * len);
                songOrder[i] = songOrder[randomIndex];
                songOrder[randomIndex] = temp;
            }
        }
    }
    
    function nextSong()
    {
        if(songOrder.length === 0)
        {
            reorderSongs(songs.length, serverHandler.playlistMode);
        }
    
        return serverHandler.songs[songOrder.pop()];
    }
    
    serverHandler.onChange((sameCat) =>
    {
        let songParagraph = document.getElementById('music-title');
        songParagraph.style.transition = 'opacity ' + SONG_FADE_TIME + 's';
    
        serverHandler.currentPage(data =>
        {
            document.getElementById('page').innerHTML = data;
            document.title = serverHandler.pages[serverHandler.page];
        });
    
        if(!sameCat || firstRun)
        {
            firstRun = false;
    
            reorderSongs(serverHandler.songs.length, serverHandler.playlistMode);
    
            function songPlayer()
            {
                let song = nextSong();
    
                let ctx = new AudioContext();
    
                let songNameFinished = false;
                let songDownloadFinished = false;
    
                let songName;
                
                fetch('/api/songinfo?id=' + song)
                    .then(data => data.json())
                    .then((json) =>
                    {
                        songName = json.name;
                        songNameFinished = true;
    
                        if(songDownloadFinished)
                        {
                            songParagraph.innerHTML = songName;
                            songParagraph.style.opacity = 1;
                            setTimeout(() =>
                            {
                                songParagraph.style.opacity = 0;
                            }, SONG_FADE_TIME * 1000 + SONG_NOTIFICATION_TIME * 1000);    
                        }
                    });
    
                fetch('/api/song?id=' + song)
                    .then(data => data.arrayBuffer())
                    .then(buffer => ctx.decodeAudioData(buffer))
                    .then(audioData =>
                    {
                        let playsound = ctx.createBufferSource();
                        playsound.buffer = audioData;
                        playsound.connect(ctx.destination);
                        playsound.start(ctx.currentTime);
                        playsound.addEventListener('ended', (e) =>
                        {
                            playsound.disconnect();
                            ctx.close();
    
                            songPlayer();
                        });
    
                        songDownloadFinished = true;
    
                        if(songNameFinished)
                        {
                            songParagraph.innerHTML = songName;
                            songParagraph.style.opacity = 1;
                            setTimeout(() =>
                            {
                                songParagraph.style.opacity = 0;
                            }, SONG_FADE_TIME * 1000 + SONG_NOTIFICATION_TIME * 1000);    
                        }
                    });
            }
    
            songPlayer();
        }
    });
    
    serverHandler.start();
});