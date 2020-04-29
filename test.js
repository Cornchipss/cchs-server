const AccountManager = require('./account-manager');

let acc = new AccountManager((mgr) =>
{
    acc.register('a', 'b', 'c', 'd', (res, err) =>
    {
        console.log(res);
        console.log(err);
    });
});
