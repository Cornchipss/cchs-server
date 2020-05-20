var ui = 
{
    addPageUI: (catName) =>
    {
        document.getElementById('add-page-UI').style.display = 'block';
        document.body.style.overflow = 'hidden';
    },

    addPageUIClose: () =>
    {
        document.getElementById('add-page-UI').style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    addCategory: (cat) =>
    {
        /**
         * Creates an element and gives it the child of child, then returns the list element
         * Use this for chaining stuff
         * @param {HTMLElement} child The child to append
         * @param {Array} attribs The attributes to put onto the object
         * @param {Array} modifications The properties to give to the HTML Element
         */
        function elem(elemName, child, attribs, modifications)
        {
            let elem = document.createElement(elemName);
            if(child)
            {
                if(child instanceof Array)
                {
                    child.forEach(c =>
                    {
                        if(typeof c === 'string')
                            c = document.createTextNode(child);
                        elem.appendChild(c);
                    });
                }
                else
                {
                    if(typeof child === 'string')
                        child = document.createTextNode(child);
                    elem.appendChild(child);
                }
            }

            if(attribs)
            {
                Object.keys(attribs).forEach(attrib =>
                {
                    elem.setAttribute(attrib, attribs[attrib]);
                });
            }

            if(modifications)
            {
                Object.keys(modifications).forEach(mod =>
                {
                    elem[mod] = modifications[mod];
                });
            }

            return elem;
        }

        let container = elem('div', 
        [
            elem('button', '+', null,
            {
                classList: ['expander'],
                id: cat.name + '-expander',
                onclick: () =>
                {
                    let info = document.getElementById(`info-${cat.name}`);
                    if(info.style.display === 'none')
                    {
                        document.getElementById(`${cat.name}-expander`).innerHTML = '-';
                        info.style.display = 'flex';
                    }
                    else
                    {
                        document.getElementById(`${cat.name}-expander`).innerHTML = '+';
                        info.style.display = 'none';
                    }
                }
            }),
            elem('span', cat.name)
        ], null, {id: cat.name, classList: ['category-name']});
        
        // Appends the container to the actual doccument
        document.getElementById('categories').appendChild(elem('li', container));

        let categoryInfo = elem('div', elem('h3', 'Pages'), null, 
        {
            classList: ['info-div'],
            id: 'info-' + cat.name
        });
        categoryInfo.style.display = 'none';

        let pagesList = elem('ul',
            elem('button', null, null,
            {
                onclick: () =>
                {
                    ui.addPageUI(cat.name);
                },
                innerHTML: '<span>+</span>',
                classList: ['add-page']
            }), 
            {id: cat.name + '-ul'});
        
        cat.pages.forEach(page =>
        {
            ui.addPage(pagesList, page);
        });
        categoryInfo.appendChild(pagesList);

        categoryInfo.appendChild(elem('li', elem('div', 
        [
            elem('h3', 'Page Interval (seconds)'),
            elem('ul', elem('li', elem('input', null, 
            {
                min: 0,
                max: 9999999,
                type: 'number'
            },
            {
                value: cat.interval,
                onkeypress: (e) =>
                {
                    if(e.key < '0' || e.key > '9' || e.target.value.length > 6) // prevents negative #s + intervals over 3 years
                        return e.preventDefault() && false; // an easy way of one-lining a cancelled event
                }
            })))
        ])));

        categoryInfo.appendChild(elem('li', elem('div', 
        [
            elem('h3', 'Playlist'), 
            elem('ul', 
            [
                elem('li', elem('p', cat.playlist, {'contenteditable': 'true'})),
                elem('li', elem('p', cat.playlistMode, {'contenteditable': 'true'}))
            ])
        ])));

        container.appendChild(categoryInfo);
    },

    addPage: (cat, page) =>
    {
        let liElem = document.createElement('li');
        liElem.classList.add('page')
        liElem.innerHTML = page;
        liElem.contentEditable = true;

        liElem.onkeypress = (ev) =>
        {
            if(liElem.innerText.length === 30)
                return false;

            if(ev.key === 'Enter')
                return false;

            if(!('A' <= ev.key && ev.key <= 'Z' || 'a' <= ev.key && ev.key <= 'z' || '0' <= ev.key && ev.key <= '9' || ev.key === '-' || ev.key === '_'))
            {
                return false;
            }
            return true;
        }

        let parent;

        if(typeof cat === 'string')
        {
            parent = document.getElementById(cat + '-ul');
        }
        else if(cat instanceof HTMLElement)
        {
            parent = cat; // the "cat" is actually the HTML element to append it to. Used during initialization
        }
        else
        {
            parent = document.getElementById(cat.name + '-ul');
        }
        
        parent.insertBefore(liElem, parent.childNodes[parent.childNodes.length - 1]);
    },
};