const Component = require('./component');

const multer = require('multer');
const Category = require('../category');
const upload = multer({dest: './uploads/'}); // ./uploads/ is a temp directory to store all uploaded files

module.exports = class extends Component
{
    constructor(categoryManager)
    {
        super();
        this.categoryManager = categoryManager;
    }

    init(app)
    {
        app.post('/api/page', upload.single('page'), (req, res, next) => this.action(req, res, next));
    }

    action(req, res, next)
    {
        let file = req.file;
        let name = req.body['name'];
        let category = req.body['category'];

        if(!file || !name || !category)
        {
            res.status(400).send('Must specify a file, name, and category.');
            return;
        }

        if(this.categoryManager.categoryExists(category))
        {
            let cat = this.categoryManager.getCategory(category);
            cat.addPage(name, file);

            res.status(200).type('json').send(JSON.stringify({success: true}));
        }
        else
        {
            this.categoryManager.addCategory(
                new Category(category, (cat) =>
                {
                    cat.addPage(name, file, -1, () =>
                    {
                        res.status(200).type('json').send(JSON.stringify({success: true}));
                    });
                }));
        }
    }
}