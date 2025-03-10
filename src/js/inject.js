// JS Execute Script inject.js

;(async () => {
    console.log('%c GitHub Extension: inject.js', 'color: Khaki')
})()

// Detect multiple injections for run-once code
if (!window.injected) {
    window.injected = true
    console.debug('Adding runtime.onMessage Listener')
    chrome.runtime.onMessage.addListener(onMessage)
    setTimeout(function () {
        alert('Script injected script: inject.js')
    }, 1)
} else {
    setTimeout(function () {
        alert('Already injected script: inject.js')
    }, 1)
}

/**
 * onMessage Handler
 * @function onMessage
 * @param {String} message
 * @param {MessageSender} sender
 * @param {Function} sendResponse
 */
function onMessage(message, sender, sendResponse) {
    console.log('onMessage:', message, sender)
    sendResponse('Response from Injected onMessage handler')
}
