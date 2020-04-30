window.addEventListener('DOMContentLoaded', () =>
{    
    let songOrder = [];
    let prevCategory;

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
                reorderSongs(songs.length, res.currentCategory.playlistMode);
            }

            if(firstRun)
            {
                firstRun = false;
                let song = songs[songOrder.pop()];
                
                function songPlayer()
                {
                    let ctx = new AudioContext();

                    fetch('/api/song?name=' + song)
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
                                console.log('game over.');
                                playsound.disconnect();
                            });
                        });
                    // let audio = new Audio('/api/song?name=' + song);
                    // audio.addEventListener('loadeddata', (e) =>
                    // {
                    //     console.log(e);
                    // });
                    // audio.play();
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