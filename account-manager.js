const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const DEBUG = require('./DEBUG');

const fs = require('fs');

const SALT_ROUNDS = 10;
const TOKEN_LIFETIME = 1000 * 60 * 60 * 24 * 10; // How long a token will live for (in milliseconds)

module.exports = class
{
    constructor(callback)
    {
        fs.exists('./secret/auth.json', exists =>
        {
            if(exists)
            {
                fs.readFile('./secret/auth.json', (err, res) =>
                {
                    if(err)
                        throw err;

                    this._data = JSON.parse(res);

                    if(callback)
                        callback(this);
                });
            }
            else
            {
                this._data = {};
                this._data.users = {};
                this._data.tokens = {};
                
                this._save();

                if(callback)
                    callback(this);
            }
        });
    }

    register(username, password, authUser, authPassword, callback)
    {
        if(!username || !password || !authUser || !authPassword ||
            typeof(username) !== 'string' || typeof(password) !== 'string' || typeof(authUser) !== 'string' || typeof(authPassword) !== 'string')
        {
            if(callback)
                callback(undefined, 'Username, password, authenticator username, or authenticator password was not provided.');
            return;
        }

        if(username.length < 4 || username.length >= 30)
        {
            if(callback)
                callback(undefined, 'The username must be over 3 characters and under 30 characters');
            return;
        }

        if(/[^A-Za-z0-9]+/.test(username))
        {
            if(callback)
                callback(undefined, 'Username can only contain letters & numbers!');
            return;
        }

        if(this._data.users[username])
        {
            if(callback)
                callback(undefined, 'A user with this username already exists!');
            return;
        }

        if(this.isValidCredentials(authUser, authPassword, valid =>
        {
            if(DEBUG.IS_DEBUG || valid)
            {
                bcrypt.hash(password, SALT_ROUNDS, (err, hash) =>
                {
                    if(err) throw err;

                    this._data.users[username] = {};

                    this._data.users[username].password = hash;

                    this._generateToken((token) =>
                    {
                        this._data.users[username].token = token;
                        this._data.users[username]['token-expires'] = Date.now() + TOKEN_LIFETIME;
                        this._data.tokens[token] = username;

                        this._save();
                        callback(token);
                    });
                });
            }
            else
            {
                callback(undefined, "Invalid authorization credentials");
            }
        }));
    }

    isValidCredentials(username, password, callback)
    {
        if(this._data.users[username] !== undefined)
        {
            let encrypted = this._data.users[username].password;

            bcrypt.compare(password, encrypted, (err, match) =>
            {
                if(err) throw err;

                if(match)
                {
                    callback(true);
                }
                else
                {
                    callback(false);
                }
            });
        }
        else
            callback(false);
    }

    login(username, password, callback)
    {
        this.isValidCredentials(username, password, (valid) =>
        {
            if(valid)
            {
                this._generateToken((token) =>
                {
                    if(this._data.users[username].token)
                    {
                        this._data.tokens[this._data.users[username].token] = undefined; // remove their previous token
                    }

                    this._data.users[username].token = token;
                    this._data.users[username]['token-expires'] = Date.now() + TOKEN_LIFETIME;
                    this._data.tokens[token] = username;

                    this._save();
                    return callback(token);
                });
            }
            else
                callback(undefined, 'Invalid credentials');
        });
    }

    loginToken(token, callback)
    {
        let found = this._data.tokens[token];
        if(found)
        {
            let user = this._data.users[found];
            if(user['token-expires'] <= Date.now())
            {
                callback(undefined, 'Login token expired');
                this._data.tokens[token] = undefined; // Clean up this old token

                this._save();
            }
            else
            {
                callback(found);
            }
        }
        else
        {
            callback(undefined, 'Invalid login token');
        }
    }

    isRequestLoggedIn(req, callback)
    {
        let token = req.params['token'] || req.session.user;
        
        if(token)
        {
            this.loginToken(token, (found) =>
            {
                callback(!!found); // !! converts found to a boolean
            });
        }
        else
            callback(false);
    }
    
    _generateToken(callback)
    {
        crypto.randomBytes(256, (err, buf) =>
        {
            if(err) throw err;
            callback(buf.toString('base64'));
        });
    }

     _save(callback)
    {
        fs.exists('./secret/', exists =>
        {
            if(!exists)
            {
                fs.mkdir('./secret/', err =>
                {
                    if(err) throw err;

                    fs.writeFile('./secret/auth.json', JSON.stringify(this._data), () =>
                    {
                        if(callback)
                            callback(this);
                    });
                });
            }
            else
            {
                fs.writeFile('./secret/auth.json', JSON.stringify(this._data), () =>
                {
                    if(callback)
                        callback(this);
                });
            }
        });
    }
}