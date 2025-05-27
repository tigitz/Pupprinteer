document.title = `${document.title} - MODIFIED`
const div = document.createElement('div')
div.id = 'js-injected'
div.textContent = 'This content was added by JavaScript'
document.body.appendChild(div)
