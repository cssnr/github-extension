// JS Content Script for Codeberg

console.log('%c GitHub Extension: codeberg.js', 'color: Khaki')

document.addEventListener('DOMContentLoaded', domContentLoaded)

async function domContentLoaded() {
    console.debug('DOMContentLoaded')

    const searchParams = new URLSearchParams(window.location.search)
    console.debug('searchParams:', searchParams)
    const action = searchParams.get('gh-ext-action')
    console.debug('action:', action)

    const genToken = localStorage.getItem('gh-ext-generate-token')
    console.debug('genToken:', genToken)
    if (genToken) {
        console.debug('%c PARSING TOKEN', 'color: Yellow')
        localStorage.removeItem('gh-ext-generate-token')
        await new Promise((resolve) => setTimeout(resolve, 500))
        const token = document
            .querySelector('div.ui.info.message.flash-message.flash-info')
            ?.textContent?.trim()
        console.debug('%c token:', 'color: OrangeRed', token)
        if (token) {
            const resp = await chrome.runtime.sendMessage({ newCBToken: token })
            console.debug('resp:', resp)
            await navigator.clipboard.writeText(token)
            // if (resp) {
            //     window.close()
            // }
        } else {
            console.warn('token not found!')
        }
    }

    if (action) {
        // console.debug(`%c action: ${action}`, 'color: Yellow')
        if (action === 'generate-token') {
            console.debug('%c GENERATE TOKEN REQUEST', 'color: Lime')
            document.getElementById('name').value = 'GitHub Extension'
            document
                .querySelector('details.ui.optional.field > summary')
                .click()
            await new Promise((resolve) => setTimeout(resolve, 250))
            document.getElementById('access-token-scope-organization').value =
                'write:organization'
            document.getElementById('access-token-scope-repository').value =
                'write:repository'
            document.getElementById('access-token-scope-user').value =
                'write:user'
            localStorage.setItem('gh-ext-generate-token', 'yes')
            document.getElementById('scoped-access-submit').click()
        }
    }
}

// if (!chrome.storage.onChanged.hasListener(onChanged)) {
//     console.debug('Adding storage.onChanged Listener')
//     chrome.storage.onChanged.addListener(onChanged)
// }
//
// if (!chrome.runtime.onMessage.hasListener(onMessage)) {
//     console.debug('Adding runtime.onMessage Listener')
//     chrome.runtime.onMessage.addListener(onMessage)
// }
//
// /**
//  * On Changed Callback
//  * @function onChanged
//  * @param {Object} changes
//  * @param {String} namespace
//  */
// async function onChanged(changes, namespace) {
//     console.debug('onChanged:', changes, namespace)
//     for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
//         if (namespace === 'sync' && key === 'options') {
//             console.debug('sync.options', oldValue, newValue)
//         }
//     }
// }
//
// /**
//  * Handle Messages
//  * @function onMessage
//  * @param {Object} message
//  * @param {MessageSender} sender
//  * @param {Function} sendResponse
//  */
// function onMessage(message, sender, sendResponse) {
//     console.debug('onMessage:', message, sender)
//     if (message.verify) {
//         sendResponse('DO CRACK MAN')
//     }
// }
