window.addEventListener('DOMContentLoaded', () =>
{
    const SONG_NOTIFICATION_TIME = 5; // in seconds
    const SONG_FADE_TIME = 2; // in seconds

    let paragraph = document.getElementById('music-title');
    paragraph.style.transition = 'opacity ' + SONG_FADE_TIME + 's';

    let songOrder = [];
    let prevCategory;

    let nextBuffer;

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

    let firstRun = true;

    let songs;
    let playlistMode;

    function nextSong()
    {
        if(songOrder.length === 0)
        {
            reorderSongs(songs.length, playlistMode);
        }

        return songs[songOrder.pop()];
    }

    (function getLiveInfo()
    {
        fetch('/api/status').then(res => res.json().then(res =>
        {
            let category = res.currentCategory.name;
            let page = res.currentCategory.currentPage;
            
            let url = `/api/page?name=${page}&category=${category}`;

            let time = res.nextCategoryTime < res.currentCategory.nextPageTime ? res.nextCategoryTime : res.currentCategory.nextPageTime;

            setTimeout(getLiveInfo, time - Date.now() + 1000) // wait the ms until the next change + 1 sec to make sure server has processed everything

            if(prevCategory !== res.currentCategory.name)
            {
                prevCategory = res.currentCategory.name;

                // Different category = new playlist
                songs = res.playlist.songs;
                playlistMode = res.currentCategory.playlistMode;
                reorderSongs(songs.length, playlistMode);
            }
            
            if(firstRun)
            {
                firstRun = false;
                
                function songPlayer(buffer)
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
                                paragraph.innerHTML = songName;
                                paragraph.style.opacity = 1;
                                setTimeout(() =>
                                {
                                    paragraph.style.opacity = 0;
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
                                paragraph.innerHTML = songName;
                                paragraph.style.opacity = 1;
                                setTimeout(() =>
                                {
                                    paragraph.style.opacity = 0;
                                }, SONG_FADE_TIME * 1000 + SONG_NOTIFICATION_TIME * 1000);    
                            }
                        });
                }

                songPlayer();
            }

            fetch(url).then(res => res.text().then(res =>
            {
                document.title = page;
                document.getElementById('page').innerHTML = res;
            }));
        }));
    })();
});