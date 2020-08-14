const fs = require('fs');
const path = require('path');
const songHandler = require('./song-handler');

function loadSongs()
{
    module.exports.playlists = {};

    if(!fs.existsSync(FOLDER))
        fs.mkdirSync(FOLDER);

    fs.readdir(FOLDER, (err, files) =>
    {
        if(err)
            throw new Error(err);

        files.forEach(f =>
        {
            fs.readFile(FOLDER + f, 'utf8', (err, data) =>
            {
                if(err)
                    throw new Error(err);
                
                let name = path.parse(f).name;
                module.exports.playlists[name] = {};
                module.exports.playlists[name].ids = JSON.parse(data);
                module.exports.playlists[name].names = [];

                let ids = module.exports.playlists[name].ids;

                for(let i = 0; i < ids.length; i++)
                {
                    songHandler.getSongInfo(module.exports.playlists[name].ids[i], (err, info) =>
                    {
                        module.exports.playlists[name].names[i] = info.name;
                    });
                }
            });
        });
    });
}

const FOLDER = './playlists/';

module.exports =
{
    playlists: undefined,

    save(name, songs, callback)
    {
        fs.writeFile(`${FOLDER}${name}.json`,
            JSON.stringify(songs),
            () => 
            { 
                loadSongs(); // reloads the new songs into memory

                if(callback) 
                    callback(); 
            });
    },

    saveAll()
    {
        Object.keys(module.exports.playlists).forEach(p =>
        {
            module.exports.save(p, module.exports.playlists[p].ids);
        });
    }
}

if(!module.exports.playlists)
{
    loadSongs();
}
