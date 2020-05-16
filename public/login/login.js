let unameBox;
let pwordBox;

function invalid()
{
    unameBox.setCustomValidity('Invalid username or password');
    pwordBox.setCustomValidity('Invalid username or password');
}

document.addEventListener('DOMContentLoaded', () =>
{
    unameBox = document.getElementById('username');
    pwordBox = document.getElementById('password');

    document.getElementById('form').onsubmit = (e) =>
    {
        let uname = unameBox.value;
        let pword = pwordBox.value;

        fetch('/login',
        {
            method: 'POST',
            headers:
            {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: uname, password: pword})
        }).then(res =>
        {
            res.json().then(res =>
            {
                if(res.error)
                {
                    invalid();
                }
                else
                {
                    cookieUtilities.setCookie('username', uname, 4);
                    window.location.replace('/admin');
                }
            });
        });

        return false;
    };
});