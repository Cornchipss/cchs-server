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

        Object.keys(res.playlists).forEach(p =>
        {
            ui.addPlaylist(p, res.playlists);
        });

        finishLoading();
    });

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
    alert('todo');
}