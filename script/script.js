const $ = (id) => document.getElementById(id);
const burger = $('burger');
const nav = $('nav');
const profileBtn = $('profile-btn');
const profileDropdown = $('profile-dropdown');

if (burger && nav) burger.onclick = () => (nav.classList.toggle('is-open'), burger.classList.toggle('is-open'));

if (profileBtn && profileDropdown) {
    profileBtn.onclick = (e) => (e.stopPropagation(), profileDropdown.classList.toggle('is-open'));
    document.onclick = () => profileDropdown.classList.remove('is-open');
}

document.querySelectorAll('form[data-success-message]').forEach((f) => {
    f.onsubmit = (e) => {
        e.preventDefault();
        alert(f.getAttribute('data-success-message') || 'Операция выполнена успешно!');
        f.reset();
    };
});