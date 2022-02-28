// const q = new URLSearchParams(window.location.search);
// const id = q.get('pres');
// const offline = q.get('feature') === "offline";
// console.log(q)
function register() {
    try {

        navigator.serviceWorker.register('sw.js')

    }
    catch (e) {
        console.error("Error", e)
    }
}
function unregister() {
    try {

        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (let registration of registrations) {
                registration.unregister()
            }
        })

    }
    catch (e) {
        console.error("Error", e)
    }
}
window.addEventListener('DOMContentLoaded', (event) => {

    register();

});