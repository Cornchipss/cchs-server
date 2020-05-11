const fs = require('fs');
const path = require('path');

const FOLDER = './playlists/';

module.exports =
{
    playlists: undefined,

    save(name, songs, callback)
    {
        fs.writeFile(`${FOLDER}${name}.json`,
            JSON.stringify(songs),
            () => { if(callback) callback(); });
    }
}

if(!module.exports.playlists)
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
                
                module.exports.playlists[path.parse(f).name] = JSON.parse(data);
            });
        });
    });
}
