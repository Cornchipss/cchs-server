// A note to my future self.
// Don't make another webapp without a framework again.

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

        if(child instanceof Function)
            child = child();

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

        return elem;
    }

    function checkName(name, maxNo)
    {
        if(name.trim().length === 0)
            return false;

        for(let i = 0; i < name.length; i++)
        {
            let c = name.charAt(i);
            if(!((c >= 'a' && c <= 'z') || 
                (c >= 'A' && c <= 'Z') || 
                (c >= '0' && c <= '9') ||
                (c === '-' || c === '_')))
                return false;
        }

        return name.length <= maxNo;
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
        _appendSongTo: undefined,
        _selectedCategory: undefined,

        _categories: [],
        _playlists: {},

        addPageUI: (catName) =>
        {
            ui._selectedCategory = catName;
            document.getElementById('add-page-UI').style.display = 'block';
            document.body.style.overflow = 'hidden';
        },

        addPageUIClose: () =>
        {
            ui._selectedCategory = undefined;
            document.getElementById('add-page-UI').style.display = 'none';
            document.body.style.overflow = 'auto';
        },

        finalizeCategories: (playlists) =>
        {
            ui._finalized = true;

            document.getElementById('categories').insertAdjacentElement('beforeend', 
                elem('li', elem('button', '+', null, 
                {
                    classList: ['phat-button'],
                    onclick: () =>
                    {
                        let name= '';
                        
                        while(!checkName(name, 24))
                        {
                            name = prompt('Category Name');

                            if(!name)
                                return; // Cancel was pressed
                        }

                        ui.addCategory(
                            { name: name,
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
            ui._categories.push(cat);

            let container = elem('div', 
            [
                elem('button', '+', null,
                {
                    classList: ['phat-button'],
                    id: cat.name + '-phat-button',
                    onclick: () =>
                    {
                        let info = document.getElementById(`info-${cat.name}`);
                        if(info.style.display === 'none')
                        {
                            document.getElementById(`${cat.name}-phat-button`).innerHTML = '-';
                            info.style.display = 'flex';
                        }
                        else
                        {
                            document.getElementById(`${cat.name}-phat-button`).innerHTML = '+';
                            info.style.display = 'none';
                        }
                    }
                }), 
                elem('input', undefined, {value: cat.name}, Object.assign(editNameOnly(24), {classList: ['important']}))
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
                        style: "min-width: 160px; width: 0;",
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
                                elem('ul', () =>
                                {
                                    let elems = [];
                                    
                                    if(cat.showTime[selector])
                                    {
                                        cat.showTime[selector].forEach(item =>
                                        {
                                            ui.addTimeUI(elems, item);
                                        });
                                    }

                                    elems.push(elem('li', elem('button', '+', null,
                                    {
                                        classList: ['phat-button'],
                                        onclick: () =>
                                        {
                                            ui.addTimeUI(selector, cat.name);
                                        }
                                    })));

                                    return elems;
                                }, {id: `${cat.name}-${selector}-day`})
                            ])));
                        }

                        return elems;
                    })
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

        addSong: (ulElement, n, ytid, ignoreSongInList) =>
        {
            if(!ignoreSongInList)
            {
                let pl = ui._playlists[ulElement.parentNode.parentNode.childNodes[1].innerHTML];

                pl.ids.push(ytid);
                pl.names.push(n);
            }

            let liElemento = elem('li', n, {style: 'cursor: pointer;', class: 'song', ytid: ytid});
            liElemento.onclick = () =>
            {
                ui.addSongUI(ulElement, liElemento);
            };
            
            ulElement.insertBefore(liElemento, ulElement.childNodes[ulElement.childNodes.length - 1]);
        },

        removeSong: (elem) =>
        {
            let parent = elem.parentNode;
            let node = parent.removeChild(elem);
            let playlist = ui._playlists[parent.parentNode.parentNode.childNodes[1].innerHTML];
            
            console.log(playlist);
            console.log(node);

            for(let i = 0; i < playlist.ids.length; i++)
            {
                if(playlist.ids[i] === node.getAttribute('ytid'))
                {
                    playlist.ids.splice(i, 1);
                    playlist.names.splice(i, 1);
                }
            }
        },

        addSongUI: (list, song) =>
        {
            if(song)
            {
                document.getElementById('remove-vid').style.display = 'block';
                document.getElementById('add-vid').style.display = 'none';
                document.getElementById('youtube-part').style.display = 'none';
                document.getElementById('find-vid').style.display = 'none';
                document.getElementById('youtube-id').required = false;
                document.getElementById('song-name').innerHTML = song.innerHTML;

                ui._appendSongTo = song;
            }
            else
            {
                // Inefficient? Yes. Care? No.
                document.getElementById('remove-vid').style.display = 'none';
                document.getElementById('find-vid').style.display = 'block';
                document.getElementById('add-vid').style.display = 'none';
                document.getElementById('song-name').style.display = 'none';
                document.getElementById('youtube-id').required = true;
                document.getElementById('youtube-id').value = '';
                document.getElementById('youtube-id').style.display = 'block';
                document.getElementById('youtube-part').style.display = 'block';

                ui._appendSongTo = list;
            }

            document.getElementById('add-song-UI').style.display = 'block';
            document.body.style.overflow = 'hidden';
        },

        addSongUIClose: () =>
        {
            document.getElementById('add-song-UI').style.display = 'none';
            document.body.style.overflow = 'auto';
        },

        addTimeUI: (selector, catName, value) =>
        {
            let arr = selector instanceof Array;

            let elemToAdd = 
                elem('li', 
                    elem('span', 
                        elem('input', undefined, {value: arr ? catName : value, type:'time'}), 
                    )
                );

            elemToAdd.appendChild(elem('button', '-', {class: 'phat-button-2'}, {onclick: () =>
            {
                elemToAdd.parentNode.removeChild(elemToAdd);
            }}));

            if(arr)
            {
                selector.push(elemToAdd);
            }
            else
            {
                let addTo = document.getElementById(`${catName}-${selector}-day`);
                addTo.insertBefore(elemToAdd, addTo.childNodes[addTo.childNodes.length - 1]);
            }
        },

        updateCategories: () =>
        {
            let cats = document.getElementById('categories');
            // and so the pain starts

            for(let i = 0; i < cats.childNodes.length; i++)
            {
                let li = cats.childNodes[i];

                let name = li.childNodes[0].id;

                if(name) // no name means its the button
                {
                    ui._categories[i] = ui._categories[i] || {name: name, pages: [], interval: 0, showTime: {}, playlistMode: '', playlist: '', currentPage: 0, nextPageTime: 0}

                    let infoDiv = li.childNodes[0].childNodes[2];

                    // Page interval
                    ui._categories[i].interval = Number(
                        infoDiv.childNodes[2].childNodes[0].childNodes[1]
                            .childNodes[0].childNodes[0].value); // dear God im sorry

                    // Playlist
                    ui._categories[i].playlist = infoDiv.childNodes[3].childNodes[0].childNodes[1]
                            .childNodes[0].childNodes[0].value;
                    ui._categories[i].playlistMode = infoDiv.childNodes[3].childNodes[0].childNodes[1]
                            .childNodes[1].childNodes[0].value;

                    // Showtimes
                    for(let j = 0; j <= 7; j++)
                    {
                        let index = j !== 0 ? j - 1 : '*';

                        let times = [];
                        let area = infoDiv.childNodes[4].childNodes[0].childNodes[1].childNodes[j]
                            .childNodes[0].childNodes[1];

                        area.childNodes.forEach(time =>
                        {
                            if(time.childNodes.length === 2)
                            {
                                times.push(time.childNodes[0].childNodes[0].value);
                            }
                        });

                        ui._categories[i].showTime[index] = times;
                    }

                    // Pages
                    let pages = [];
                    let renamedPages = [];

                    infoDiv.childNodes[1].childNodes.forEach(li =>
                    {
                        let node = li.childNodes[0];

                        if(node.value)
                        {
                            pages.push(node.value);

                            if(node.value !== node.getAttribute('oldName'))
                            {
                                renamedPages.push(
                                    {new: node.value, old: node.getAttribute('oldName')});
                            }
                        }
                    });

                    ui._categories[i].pages = pages;
                    ui._categories[i].renamedPages = renamedPages;
                }
            };
        },

        addPage: (cat, page) =>
        {
            let liElem = elem('li', elem('input', undefined, {value: page, oldName: page}, editNameOnly(24)));

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

        addPlaylist: (playlist, playlists) =>
        {
            if(!playlist)
                return;

            ui._playlists[playlist] = playlists[playlist] || {ids: [], names: []};

            let attachTo = document.getElementById('playlists');

            if(attachTo.childNodes.length === 0)
            {
                attachTo.appendChild(elem('li', elem('button', '+', {class: 'phat-button'}, {onclick: () =>
                {
                    ui.addPlaylist(prompt('Playlist Name'), playlists);
                }})));
            }

            let unorderedList = elem('ul');

            unorderedList.appendChild(elem('li', '+', {class: 'phat-button'}, 
            {
                onclick: (e) =>
                {
                    ui.addSongUI(unorderedList);
                }
            }));

            if(playlists[playlist]) // false if this is a newly created playlist
            {
                let pl = playlists[playlist];
                
                for(let i = 0; i < pl.names.length; i++)
                {
                    ui.addSong(unorderedList, pl.names[i], pl.ids[i], true);
                }
            }

            let playlistInfo = elem('div', unorderedList, {style:'display: none;', class: 'info-div'});
            attachTo.childNodes[attachTo.childNodes.length - 1].insertAdjacentElement('beforebegin',
                elem('li', elem('div',
                [
                    elem('button', '+', null,
                    {
                        classList: ['phat-button'],
                        onclick: (e) =>
                        {
                            if(e.target.innerHTML === '+')
                            {
                                e.target.innerHTML = '-';
                                playlistInfo.style.display = 'flex';
                            }
                            else
                            {
                                e.target.innerHTML = '+';
                                playlistInfo.style.display = 'none';
                            }
                        }
                    }), 
                    elem('span', playlist),
                    playlistInfo
                ], {style: 'font-size: 2rem;'})));
        },
    };

    return ui;
})();