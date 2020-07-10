document.addEventListener('DOMContentLoaded', () =>
{
    fetch('/api/bulk')
        .then(res => res.json())
        .then(res =>
    {
        console.log(res);

        res.categories.forEach(cat =>
        {
            ui.addCategory(cat, res.playlists);
        });

        ui.finalizeCategories(res.playlists);

        finishLoading();
    });

    serverHandler.onChange(() =>
    {
        let playlistUI = document.getElementById('playlist');
        let playlistModeUI = document.getElementById('playlist-mode');
        playlistUI.innerHTML = serverHandler.playlist;
        playlistModeUI.innerHTML = serverHandler.playlistMode;

        let songsUI = document.getElementById('songs');
        songsUI.innerHTML = '';

        serverHandler.songNames.forEach(s =>
        {
            let node = document.createElement('li');
            node.appendChild(document.createTextNode(s));
            songsUI.appendChild(node);
        });

        finishLoading();
    });

    serverHandler.start();

    let username = document.getElementById('username');
    username.innerHTML = cookieUtilities.getCookie('username');
});

function finishLoading()
{
    document.getElementById('loading').style.display = 'none';
    document.getElementById('info').style.display = 'flex';
}

function save()
{

}