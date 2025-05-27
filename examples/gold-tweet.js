console.log('Starting tweet transformation...');

(async function () {
  // Wait for the main tweet to be available
  await new Promise((resolve) => {
    const checkElement = () => {
      const mainTweet = document.querySelector('article[role="article"]')
      if (mainTweet) {
        resolve()
      }
      else {
        setTimeout(checkElement, 100)
      }
    }
    checkElement()
  })

  // Inject Tailwind CSS
  console.log('Injecting Tailwind CSS...')
  const script = document.createElement('script')
  script.src = 'https://cdn.tailwindcss.com'
  document.head.appendChild(script)

  // Wait for Tailwind to load
  await new Promise((resolve) => {
    script.onload = resolve
  })
  console.log('Tailwind CSS loaded')

  console.log('Starting transformation...')
  // Get main tweet before clearing
  const mainTweet = document.querySelector('article[role="article"]')
  if (!mainTweet)
    return

  // Extract key elements
  const avatar = mainTweet.querySelector('img[alt=""]')
  const fullName = mainTweet.querySelector('[data-testid="User-Name"] a span:first-child')
  const tweeterHandler = mainTweet.querySelector('[data-testid="User-Name"]').parentNode.querySelectorAll('a')[1]
  const content = mainTweet.querySelector('[data-testid="tweetText"]')
  const timestamp = mainTweet.querySelector('time')

  console.log(
    avatar,
    fullName,
    content,
    timestamp,
  )

  // Clear entire body
  document.body.innerHTML = ''

  // Add required meta tags and background color
  document.body.style.background = 'linear-gradient(to right, #d19e1d, #ffd86e, #e3a812)'
  document.body.className = 'min-h-screen'

  // Create new container
  const container = document.createElement('div')
  container.className = 'min-h-screen flex items-center justify-center p-4'

  // Create tweet wrapper
  const tweetWrapper = document.createElement('div')
  tweetWrapper.className = 'w-full max-w-2xl p-1 rounded-2xl'

  // Create styled tweet container
  const styledTweet = document.createElement('div')
  styledTweet.className = 'bg-white p-8 rounded-2xl'

  // Create name container with emojis
  const nameContainer = document.createElement('div')
  nameContainer.className = 'flex items-center'

  // Create name container with emojis
  const nameSpan = document.createElement('span')
  nameSpan.className = 'inline-flex items-center font-bold text-gray-900'
  nameSpan.innerHTML = fullName?.outerHTML || ''

  // Remove any existing classes from the emojis but keep them inline
  const emojiImages = nameSpan.querySelectorAll('img')
  emojiImages.forEach((img) => {
    img.className = 'h-5 w-5 inline-block'
  })

  nameContainer.appendChild(nameSpan)

  // Construct tweet HTML
  styledTweet.innerHTML = `
        <div class="flex items-start space-x-4 mb-4">
            <img src="${avatar?.src || ''}" class="w-12 h-12 rounded-full border-2 border-amber-200" alt="Avatar">
            <div class="flex-1">
                <div class="flex items-center space-x-2">
                    <div class="flex flex-col">
                        ${nameContainer.outerHTML}
                        <span class="text-gray-500 text-sm">${tweeterHandler?.textContent || ''}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="text-xl my-4 text-gray-900 leading-relaxed">${content?.innerHTML || ''}</div>
        <div class="text-sm text-gray-500 mb-4">${timestamp?.textContent || ''}</div>
    `

  // Assemble the DOM
  tweetWrapper.appendChild(styledTweet)
  container.appendChild(tweetWrapper)
  document.body.appendChild(container)
  console.log('Transformation completed')
})()
