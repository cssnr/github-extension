// JS Content Script for GitHub

console.log('%c GitHub Extension: github.js', 'color: Khaki')

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
            .getElementById('new-oauth-token')
            ?.textContent?.trim()
        console.debug('%c token:', 'color: OrangeRed', token)
        if (token) {
            const resp = await chrome.runtime.sendMessage({ newGHToken: token })
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
            document.getElementById('oauth_access_description').value =
                'GitHub Extension'

            document
                .getElementById('token-expiration')
                .querySelector('button')
                .click()
            document
                .querySelector('[data-item-id="none"]')
                .querySelector('button')
                .click()

            document.querySelector('input[value="repo"]').click()
            document.querySelector('input[value="workflow"]').click()
            document.querySelector('input[value="read:user"]').click()

            localStorage.setItem('gh-ext-generate-token', 'yes')
            document
                .getElementById('new_oauth_access')
                .querySelector('button[type="submit"]')
                .click()
        }
    }
}

// window.addEventListener('popstate', function () {
//     console.debug('%c popstate', 'color: Yellow')
//     modifyDom()
// })
//
// window.addEventListener('hashchange', function () {
//     console.debug('%c hashchange', 'color: Orange')
// })

// window.addEventListener('pageshow', pageShow)
//
// async function pageShow(event) {
//     console.debug('%c pageShow', 'color: Aqua', event)
//     function observeHistoryChanges() {
//         const pushState = history.pushState
//         const replaceState = history.replaceState
//
//         history.pushState = function (...args) {
//             pushState.apply(history, args)
//             modifyDom()
//         }
//
//         history.replaceState = function (...args) {
//             replaceState.apply(history, args)
//             modifyDom()
//         }
//
//         window.addEventListener('popstate', modifyDom)
//     }
//
//     // Initial execution and setting up observer for future route changes
//     modifyDom()
//     observeHistoryChanges()
// }

// async function modifyDom(event) {
//     console.debug('%c modifyDom:', 'color: Lime', event)
//     if (document.getElementById('clone-repository')) {
//         console.debug('%c Clone Button Already Found!', 'color: OrangeRed')
//         return
//     }
//     // const btn = document
//     //     .getElementById('repository-details-watch-button')
//     //     .cloneNode(true)
//     // // btn.removeAttribute('id')
//     // btn.removeAttribute('data-hydro-click')
//     // btn.removeAttribute('data-hydro-click-hmac')
//     // // delete btn.dataset['hydro-click']
//     // btn.id = 'clone-repository'
//     // btn.textContent = 'Clone'
//     // btn.classList.add('tooltipped', 'tooltipped-sw')
//     // btn.addEventListener('click', cloneClick)
//     // btn.setAttribute('aria-label', 'Clone Repository')
//     // const li = document.createElement('li')
//     // const ul = document.querySelector('ul.pagehead-actions')
//     // li.appendChild(btn)
//     // ul.appendChild(li)
//
//     const { options } = await chrome.storage.sync.get(['options'])
//     console.debug('options:', options)
//     const ul = document.querySelector('ul.pagehead-actions')
//     if (options.ghToken) {
//         const clone = getButton(
//             'repository-details-watch-button',
//             'clone-repository',
//             'Clone',
//             'Clone Repository',
//             cloneClick
//         )
//         if (clone) {
//             console.debug('%c Adding Clone Button.', 'color: Lime')
//             const li = document.createElement('li')
//             li.appendChild(clone)
//             ul.appendChild(li)
//         }
//     }
//     if (options.cbToken) {
//         const mirror = getButton(
//             'repository-details-watch-button',
//             'mirror-repository',
//             'Mirror',
//             'Mirror Repository',
//             mirrorClick
//         )
//         if (mirror) {
//             console.debug('%c Adding Mirror Button.', 'color: Lime')
//             const li = document.createElement('li')
//             li.appendChild(mirror)
//             ul.appendChild(li)
//         }
//     }
// }
//
// function getButton(btnID, newID, text, label, fn) {
//     if (document.getElementById(newID)) {
//         console.debug(`%c ID Already Exists: ${newID}`, 'color: OrangeRed')
//         return
//     }
//     const btn = document.getElementById(btnID)?.cloneNode(true)
//     if (!btn) {
//         return
//     }
//     btn.removeAttribute('data-hydro-click')
//     btn.removeAttribute('data-hydro-click-hmac')
//     // delete btn.dataset['hydro-click']
//     btn.id = newID
//     btn.textContent = text
//     btn.classList.add('tooltipped', 'tooltipped-sw')
//     btn.addEventListener('click', fn)
//     btn.setAttribute('aria-label', label)
//     return btn
// }
//
// function cloneClick(event) {
//     console.debug('%c cloneClick:', 'color: Khaki', event)
//     event.preventDefault()
//     const target = event.currentTarget
//     console.debug('target:', target)
//     if (target.classList.contains('disabled')) {
//         console.debug('%c Button Disabled:', 'color: Yellow')
//         return
//     }
//     target.classList.add('disabled')
// }
//
// function mirrorClick(event) {
//     console.debug('%c mirrorClick:', 'color: OrangeRed', event)
//     event.preventDefault()
//     const target = event.currentTarget
//     console.debug('target:', target)
//     if (target.classList.contains('disabled')) {
//         return console.debug('%c Button Disabled:', 'color: Yellow')
//     }
//     target.classList.add('disabled')
// }

// let tabEnabled = false

// ;(async () => {
//     // get options
//     // const { options } = await chrome.storage.sync.get(['options'])
//     // const { sites } = await chrome.storage.local.get(['sites'])
//     const { options, sites } = await chrome.storage.sync.get([
//         'options',
//         'sites',
//     ])
//     console.log('options:', options)
//     console.log('sites:', sites)
//     // console.log('window.location.hostname:', window.location.hostname)
//     // if (sites.includes(window.location.hostname)) {
//     //     tabEnabled = true
//     //     const response = await chrome.runtime.sendMessage({ badgeText: 'On' })
//     //     console.log('response:', response)
//     // }
//     const btn = document.getElementById('fork-button').cloneNode(true)
//     btn.textContent = 'Clone'
//     const li = document.createElement('li')
//     const ul = document.querySelector('ul.pagehead-actions')
//     li.appendChild(btn)
//     ul.appendChild(li)
//     console.debug('%c Appended Button to UL.', 'color: Magenta')
// })()

// if (!chrome.storage.onChanged.hasListener(onChanged)) {
//     console.debug('Adding storage.onChanged Listener')
//     chrome.storage.onChanged.addListener(onChanged)
// }

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
//         // if (namespace === 'sync' && key === 'sites') {
//         //     console.debug('sync.sites', oldValue, newValue)
//         //     await sitesChange(newValue)
//         // }
//     }
// }

// async function sitesChange(data) {
//     console.debug('sitesChange', data)
//     console.debug('window.location.hostname', window.location.hostname)
//     if (data.includes(window.location.hostname)) {
//         await chrome.runtime.sendMessage({ badgeText: 'On' })
//         if (!tabEnabled) {
//             tabEnabled = true
//         }
//     } else {
//         await chrome.runtime.sendMessage({ badgeText: '' })
//         if (tabEnabled) {
//             tabEnabled = false
//         }
//     }
// }
