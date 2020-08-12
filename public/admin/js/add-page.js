document.addEventListener('DOMContentLoaded', () =>
{
    function err(elem, er)
    {
        if(er)
            elem.style.borderBottom = 'red thick solid';
        else
            elem.style.borderBottom = '#048 thick solid';
    }

    const fileUI = document.getElementById('file');
    const nameUI = document.getElementById('name');
    const catUI  = document.getElementById('category');

    nameUI.oninput = (ev) =>
    {
        name = nameUI.value;
        if(name.length > 30)
        {
            err(nameUI, 'The name\'s length cannot be over 30 characters.');
            return false;
        }
        for(let i = 0; i < name.length; i++)
        {
            let c = name.charAt(i);
            if(!('A' <= c && c <= 'Z' || 'a' <= c && c <= 'z' || '0' <= c && c <= '9' || c === '-' || c === '_'))
            {
                err(nameUI, 'File name may only have a-z, 0-9, - and _');
                return;
            }
        }

        err(nameUI, undefined);
    }

    document.getElementById('form').onsubmit = (e) =>
    {
        let file, name, category;
        file = fileUI.value;
        name = nameUI.value;
        category = catUI.value;

        if(name.length > 30)
        {
            err(nameUI, 'The name\'s length cannot be over 30 characters.');
            return false;
        }

        if(!file)
        {
            err(fileUI, 'No file provided.');
            return false;
        }
        if(!name.trim())
        {
            err(nameUI, 'No name provided');
            return false;
        }
        for(let i = 0; i < name.length; i++)
        {
            let c = name.charAt(i);
            if(!('A' <= c && c <= 'Z' || 'a' <= c && c <= 'z' || '0' <= c && c <= '9' || c === '-' || c === '_'))
            {
                err(nameUI, 'File name may only have a-z, 0-9, - and _');
                return false;
            }
        }
        if(!category)
        {
            err(catUI, 'No category provided');
            return false;
        }
        
        let form = document.getElementById('form');

        fetch('/admin/api/page', {
            method: 'POST',
            body: new FormData(form)
        })
        .then(res => res.json())
        .then(res => 
        {
            if(res.success)
            {
                document.getElementById('add-page-UI').style.display = 'none';
                document.body.style.overflow = 'auto';

                let ul = document.getElementById(category + '-ul');
                let li = document.createElement('li');
                li.innerHTML = name;
                li.contentEditable = true;
                li.classList.add('page');
                ul.insertBefore(li, ul.childNodes[ul.childNodes.length - 1]);
            }
            else
                alert(res.error);
        });

        return false;
    }
});