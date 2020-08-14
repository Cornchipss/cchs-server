document.addEventListener('DOMContentLoaded', () =>
{
    fetch('/api/bulk')
        .then(res => res.json())
        .then(res =>
    {
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
    const data = {};

    // Compute Name Changes

    data.nameChanges = {};
    data.categories = {};

    for(let i = 0; i < ui._categories.length; i++)
    {
        let allCats = document.getElementById('categories');
        
        let htmlNode = allCats.childNodes[i];
        let htmlNode2 = htmlNode.childNodes[htmlNode.childNodes.length - 1];
        let newName = htmlNode2.childNodes[htmlNode2.childNodes.length - 2].value;

        if(ui._categories[i].name !== newName)
        {
            data.nameChanges[ui._categories[i].name] = newName;
        }
    }

    // End computing name changes

    data.categories = ui._categories;
    data.playlists = ui._playlists;

    console.log(data);

    fetch('/admin/api/bulk', 
    {
        method: 'POST', 
        headers:
        {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res => res.json())
        .then(res =>
    {
        console.log(res);
    });
}