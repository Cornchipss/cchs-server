var ui = (() =>
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
                if(attribs[attrib] !== undefined)
                {
                    elem.setAttribute(attrib, attribs[attrib]);
                }
            });
        }

        if(modifications)
        {
            Object.keys(modifications).forEach(mod =>
            {
                if(elem[mod] !== undefined)
                {
                    elem[mod] = modifications[mod];
                }
            });
        }

        return elem;
    }

    function editNameOnly(maxNo)
    {
        return {
            onkeypress: (e) =>
            {
                if(((e.key >= 'a' && e.key <= 'z') || 
                    (e.key >= 'A' && e.key <= 'Z') || 
                    (e.key >= '0' && e.key <= '9') ||
                    (e.key === '-' || e.key === '_'))
                    &&
                    (e.target.value.length < maxNo))
                {
                    return true;
                }
                else
                {
                    e.preventDefault();
                    return true;
                }
            },

            onpaste: (e) =>
            {
                e.preventDefault();
                return false;
            },

            ondrag: (e) =>
            {
                e.preventDefault();
                return false;
            }
        }
    }

    let ui = 
    {
        _finalized: false,

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

        finalizeCategories: (playlists) =>
        {
            ui._finalized = true;

            document.getElementById('categories').insertAdjacentElement('beforeend', 
                elem('li', elem('button', '+', null, 
                {
                    classList: ['expander'],
                    onclick: () =>
                    {
                        ui.addCategory(
                            { name: 'new-category',
                                currentPage: 0,
                                playlist: undefined,
                                playlistMode: 'shuffle',
                                showTime: {},
                                interval: 30000,
                                pages: []
                            }, playlists);
                    }
                }))
            );
        },

        addCategory: (cat, playlists) =>
        {
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
                elem('input', undefined, {value: cat.name}, editNameOnly(24))
            ], null, {id: cat.name, classList: ['category-name']});
            
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

            console.log(cat);

            categoryInfo.appendChild(elem('li', elem('div', 
            [
                elem('h3', 'Page Interval'),
                elem('ul', elem('li', 
                [
                    elem('input', null, 
                    {
                        min: 0,
                        max: 9999999,
                        type: 'number',
                        style: "font-size: 1.0em; border: none; min-width: 160px; width: 0;",
                        value: cat.interval
                    },
                    {
                        onkeypress: (e) =>
                        {
                            if(e.key < '0' || e.key > '9' || e.target.value.length > 6) // prevents negative #s + intervals over 3 years
                                return e.preventDefault() && false; // an easy way of one-lining a cancelled event
                        }
                    }),
                    elem('span', ' seconds')
                ]))
            ])));

            categoryInfo.appendChild(elem('li', elem('div', 
            [
                elem('h3', 'Playlist'), 
                elem('ul', 
                [
                    elem('li', elem('select', 
                        (() => // Creates a list of options with each playlist
                        {
                            let elems = [];
                            Object.keys(playlists).forEach(k =>
                            {
                                elems.push(elem('option', k, {value: k, selected: cat.playlist === k ? 'selected' : undefined}));
                            });
                            return elems;
                        })()
                    )),
                    elem('li', elem('select', 
                    [
                        elem('option', 'Shuffle', 
                            { value: 'shuffle', selected: cat.playlistMode === 'shuffle' ? 'selected' : undefined }),
                        elem('option', 'In Order', 
                            { value: 'ordered', selected: cat.playlistMode === 'ordered' ? 'selected' : undefined }),
                    ]))
                ])
            ])));

            categoryInfo.appendChild(elem('li', elem('div',
            [
                elem('h3', 'Showtimes'),
                elem('ul', 
                    (() =>
                    {
                        let days = ['Every Day', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                        let elems = [];
                        for(let i = 0; i < 8; i++)
                        {
                            let selector = i === 0 ? ('*') : i - 1;

                            elems.push(elem('li', elem('div', 
                            [
                                elem('h4', days[i]),
                                elem('ul', (() =>
                                {
                                    let elems = [];
                                    
                                    if(cat.showTime[selector])
                                    {
                                        cat.showTime[selector].forEach(item =>
                                        {
                                            elems.push(elem('li', elem('span', [elem('input', undefined, {value: item, type:'time'}), elem('button', '-')])))
                                        });
                                    }

                                    elems.push(elem('li', elem('button', '+', null,
                                    {
                                        classList: ['expander'],
                                        onclick: () =>
                                        {
                                            ui.addTimeUI(selector, cat.name);
                                        }
                                    })));

                                    return elems;
                                })())
                            ])));
                        }

                        return elems;
                    })()
                )
            ])));
            
            container.appendChild(categoryInfo);

            if(ui._finalized)
            {
                let toAttach = document.getElementById('categories');
                toAttach.childNodes[toAttach.childNodes.length - 1]
                    .insertAdjacentElement('beforebegin', elem('li', container));
            }
            else
            {
                document.getElementById('categories').appendChild(elem('li', container));
            }
        },

        addPage: (cat, page) =>
        {
            let liElem = elem('li', elem('input', undefined, {value: page}, editNameOnly(24)));
            /*

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
            */
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

    return ui;
})();