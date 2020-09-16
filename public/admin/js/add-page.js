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

    nameUI.oninput = () =>
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

    document.getElementById('add-song-UI').onsubmit = (e) =>
    {
        e.preventDefault();

        let findVid = document.getElementById('find-vid').style.display !== 'none';
        let addVid  = document.getElementById('add-vid').style.display !== 'none';

        if(findVid)
        {
            let val = document.getElementById('youtube-id').value.trim();
            
            if(val.length === 'dQw4w9WgXcQ'.length)
            {
                fetch(`/api/songinfo?id=${val}`).then(res =>
                {
                    if(res.status === 200)
                    {
                        res.json().then(res =>
                        {
                            e.submitter.style.display = 'none';
                            document.getElementById('add-vid').style.display = 'block';
                            document.getElementById('song-name').innerHTML = res.name;
                            document.getElementById('song-name').style.display = 'block';
                            document.getElementById('youtube-id').style.display = 'none';
                        });
                    }
                    else
                    {
                        alert('A song with the ID of ' + val + ' was not found!');
                    }
                });
            }
            else
                alert('Invalid youtube ID format.');
        }
        else if(addVid)
        {
            ui.addSong(ui._appendSongTo, document.getElementById('song-name').innerHTML, document.getElementById('youtube-id').value);
            ui.addSongUIClose();
        }
        else // remove-vid
        {
            ui.removeSong(ui._appendSongTo);
            ui.addSongUIClose();
        }


        return false;
    }

    document.getElementById('add-page-UI').onsubmit = (e) =>
    {
        e.preventDefault();

        let file, name, category;
        file = fileUI.value;
        name = nameUI.value;
        category = ui._selectedCategory;

        if(name.length > 24)
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
        
        save(() =>
        {
            let form = document.getElementById('form');

            let tempInput = document.createElement('input');
            tempInput.name = 'category';
            tempInput.value = category;
            tempInput.style.display = 'none';
            form.appendChild(tempInput); // a quick and dirty method of adding the category to the form
            // This ^^^ is horrible. Please learn from my mistakes.

            fetch('/admin/api/page', {
                method: 'POST',
                body: new FormData(form)
            })
            .then(res => res.json())
            .then(res => 
            {
                form.removeChild(tempInput); // clean up my mistakes

                if(res.success)
                {
                    ui.addPageUIClose();

                    ui.addPage(category, name);
                }
                else
                    alert(res.error);
            });
        });

        return false;
    }
});