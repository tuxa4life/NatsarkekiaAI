const params = new URLSearchParams(window.location.search)
const text = params.get('value') || 'Can\' fetch value.'

document.querySelector('.value').textContent = text

if (params.get('blinking') !== 'true') {
    document.querySelector('.mic-icon').style.display = 'none'
}