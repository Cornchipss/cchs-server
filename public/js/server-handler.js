let onChanges = [];

let prevCategory = undefined;

var serverHandler =
{
    onChange: (func) =>
    {
        onChanges.push(func);
    },

    /**
     * Gets the current page
     */
    currentPage: (callback) =>
    {
        if(serverHandler.page === undefined || serverHandler.category === undefined)
            return callback(undefined);

        fetch(`/api/page?name=${serverHandler.pages[serverHandler.page]}&category=${serverHandler.category}`)
            .then(res => res.text()
            .then(res =>
            callback(res)));
    },

    category: undefined,
    page: undefined,
    songs: undefined,
    playlistMode: undefined,
    pages: undefined,

    start: () =>
    {
        fetch('/api/status').then(res => res.json().then(res =>
        {
            serverHandler.category = res.currentCategory.name;
            serverHandler.pages = res.currentCategory.pages;
            serverHandler.page = res.currentCategory.currentPage;
            
            let time = res.nextCategoryTime < res.currentCategory.nextPageTime ? res.nextCategoryTime : res.currentCategory.nextPageTime;
            setTimeout(serverHandler.start, time - Date.now() + 1000) // wait the ms until the next change + 1 sec to make sure server has processed everything
    
            let sameCat = true;
    
            if(prevCategory !== res.currentCategory.name)
            {
                sameCat = false;
                prevCategory = res.currentCategory.name;
    
                // Different category = new playlist
                serverHandler.songs = res.playlist.songs;
                serverHandler.playlistMode = res.currentCategory.playlistMode;
            }
    
            onChanges.forEach(f => f(sameCat));
        }));
    }
};