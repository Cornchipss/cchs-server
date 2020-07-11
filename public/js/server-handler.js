let onChanges = [];
let onReady = [];

let prevCategory = undefined;

let onReadyCalled = false;

var serverHandler =
{
    onChange: (func) =>
    {
        onChanges.push(func);
    },

    onReady: (func) =>
    {
        onReady.push(func);
    },

    /**
     * Gets the current page
     */
    currentPage: (callback) =>
    {
        if(serverHandler.page === undefined || serverHandler.category === undefined)
            return callback(undefined);

        fetch(`/api/render?name=${serverHandler.pages[serverHandler.page]}&category=${serverHandler.category}`)
            .then(res => res.text()
            .then(res =>
            callback(res)));
    },

    category: undefined,
    page: undefined,
    songNames: undefined,
    songIds: undefined,
    playlist: undefined,
    playlistMode: undefined,
    pages: undefined,

    start: () =>
    {
        fetch('/api/status').then(res => res.json().then(res =>
        {
            serverHandler.category = res.currentCategory.name;
            serverHandler.pages = res.currentCategory.pages;
            serverHandler.page = res.currentCategory.currentPage;
            serverHandler.playlist = res.currentCategory.playlist;

            let time;
            if(res.nextCategoryTime !== undefined)
            {
                time = res.nextCategoryTime;
            }
            if(res.nextPageTime !== undefined && res.nextPageTime < res.nextCategoryTime 
                    || res.nextCategoryTime === undefined)
            {
                time = res.nextPageTime;
            }

            if(time !== undefined)
            {
                let time = res.nextCategoryTime < res.currentCategory.nextPageTime ? res.nextCategoryTime : res.currentCategory.nextPageTime;
                setTimeout(serverHandler.start, time - Date.now() + 1000) // wait the ms until the next change + 1 sec to make sure server has processed everything
            }        
            
            if(prevCategory !== res.currentCategory.name)
            {
                sameCat = false;
                prevCategory = res.currentCategory.name;
    
                // Different category = new playlist
                serverHandler.songIds = res.playlist.songs.ids;

                serverHandler.songNames = res.playlist.songs.names;

                serverHandler.playlistMode = res.currentCategory.playlistMode;

                onReady.forEach(f => f());
            }
            else
            {
                onChanges.forEach(f => f(true));
            }
        }));
    }
};