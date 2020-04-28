const Component = require('./component');

const SongHandler = require('../song-handler');

module.exports = class extends Component
{
    init(app)
    {
        app.post('/api/song', (req, res, next) => this.action(req, res, next));
    }

    action(req, res, next)
    {
        let name = req.body['name'];

        SongHandler.getSong(5, name, (err, result, finish) =>
        {
            if(err)
            {
                res.status(result).send(err); // in this case result is the error code
            }
            else
            {
                res.sendFile(result, () => finish()); // in this case result is the song's file
            }
        });
    }
}