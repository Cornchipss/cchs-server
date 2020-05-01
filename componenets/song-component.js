const Component = require('./component');

const SongHandler = require('../song-handler');

module.exports = class extends Component
{
    init(app)
    {
        app.post('/api/song', (req, res, next) => this.action(req, res, next));
        app.get('/api/song', (req, res, next) => this.action(req, res, next));

        app.get('/api/songinfo', (req, res, next) => this.songinfo(req, res, next));
    }

    songinfo(req, res, next)
    {
        let id = req.query['id'];

        SongHandler.getSongInfo(id, (err, result) =>
        {
            if(err)
            {
                res.status(result).send(err); // in this case result is the error code
            }
            else
            {
                res.type('json').send(JSON.stringify(result)); // in this case result is the song's file
            }
        });
    }

    action(req, res, next)
    {
        let name = req.body['name'] || req.query['name'];
        let id = req.body['id'] || req.query['id'];

        if(!id && name)
        {
            SongHandler.getSong(5, name, (err, result) =>
            {
                if(err)
                {
                    res.status(result).send(err); // in this case result is the error code
                }
                else
                {
                    res.sendFile(result); // in this case result is the song's file
                }
            });
        }
        if(!name && id)
        {
            SongHandler.getSongId(id, (err, result) =>
            {
                if(err)
                {
                    res.status(result).send(err);
                }
                else
                {
                    res.sendFile(result);
                }
            });
        }
    }
}