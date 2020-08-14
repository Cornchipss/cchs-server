const Component = require('./component');

const multer = require('multer');
const Category = require('../category');
// 2 MB max file size
const upload = multer({fileSize: 1024 * 1024 * 2, dest: './uploads/'}); // ./uploads/ is a temp directory to store all uploaded files

module.exports = class extends Component
{
    constructor(categoryManager)
    {
        super();
        this.categoryManager = categoryManager;
    }

    init(app)
    {
        app.post('/admin/api/page', upload.single('page'), (req, res, next) => 
        {
            this.action(req, res, next)
        });
    }

    action(req, res, next)
    {
        let file = req.file; // There is no way of checking if this is a markdown file. So I just assume
        let name = req.body['name'];
        let category = req.body['category'];

        if(!file || !name || !category)
        {
            res.type('json').status(400).send(JSON.stringify({error: 'Must specify a file, name, and category.'}));
            return;
        }

        for(let i = 0; i < name.length; i++)
        {
            let c = name.charAt(i);
            if(!('A' <= c && c <= 'Z' || 'a' <= c && c <= 'z' || '0' <= c && c <= '9' || c === '-' || c === '_'))
            {
                err(nameUI, 'File name may only have a-z, 0-9, - and _');
                res.type('json').status(400).send(JSON.stringify({error: 'File name may only have a-z, 0-9, - and _'}));
            }
        }

        if(name.length > 30)
        {
            res.type('json').status(400).send(JSON.stringify({error: 'Name cannot be over 30 characters'}));
        }

        if(this.categoryManager.categoryExists(category))
        {
            let cat = this.categoryManager.getCategory(category);
            cat.addPage(name, file);

            res.status(200).type('json').send(JSON.stringify({success: true}));
        }
        else
        {
            res.status(400).type('json').send(JSON.stringify({error: `Category "${category}" does not exist!`}));
        }
        // else
        // {
        //     this.categoryManager.addCategory(
        //         new Category(category, (cat) =>
        //         {
        //             cat.addPage(name, file, -1, () =>
        //             {
        //                 res.status(200).type('json').send(JSON.stringify({success: true}));
        //             });
        //         }));
        // }
    }
}