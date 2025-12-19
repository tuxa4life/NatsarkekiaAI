const params = new URLSearchParams(window.location.search)
const text = params.get('value') || 'Can\' fetch value.'

document.querySelector('.value').textContent = text
