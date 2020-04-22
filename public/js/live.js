window.addEventListener('DOMContentLoaded', () =>
{
    (function getLiveInfo()
    {
        fetch('/api/status').then(res => res.json().then(res =>
        {
            let category = res.currentCategory._name;
            let page = res.currentPage;
            
            let url = `/api/page?name=${page}&category=${category}`;

            let time = res.nextCategoryTime < res.currentCategory._nextPageTime ? res.nextCategoryTime : res.currentCategory._nextPageTime;

            setTimeout(getLiveInfo, time - Date.now() + 1000) // wait the ms until the next change + 1 sec to make sure server has processed everything

            fetch(url).then(res => res.text().then(res =>
            {
                document.title = page;
                document.getElementById('page').innerHTML = res;
            }));
        }));
    })();
});