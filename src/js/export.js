// JS Exports

import { Github } from './api/github.js'

export const githubURL = 'https://github.com/cssnr/github-extension'

/**
 * Save Options Callback
 * @function saveOptions
 * @param {UIEvent} event
 */
export async function saveOptions(event) {
    console.debug('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let key = event.target.id
    let value
    if (event.target.type === 'radio') {
        key = event.target.name
        const radios = document.getElementsByName(key)
        for (const input of radios) {
            if (input.checked) {
                value = input.id
                break
            }
        }
    } else if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else if (event.target.type === 'number') {
        const number = parseFloat(event.target.value)
        let min = parseFloat(event.target.min)
        let max = parseFloat(event.target.max)
        if (!isNaN(number) && number >= min && number <= max) {
            event.target.value = number.toString()
            value = number
        } else {
            event.target.value = options[event.target.id]
            return
        }
    } else {
        value = event.target.value
    }
    if (value !== undefined) {
        options[key] = value
        console.log(`Set %c${key}:`, 'color: Khaki', value)
        await chrome.storage.sync.set({ options })
    } else {
        console.warn(`No Value for key: ${key}`)
    }
}

/**
 * Update Options
 * @function initOptions
 * @param {Object} options
 */
export function updateOptions(options) {
    console.debug('updateOptions:', options)
    for (let [key, value] of Object.entries(options)) {
        if (typeof value === 'undefined') {
            console.warn('Value undefined for key:', key)
            continue
        }
        // Option Key should be `radioXXX` and values should be the option IDs
        if (key.startsWith('radio')) {
            key = value //NOSONAR
            value = true //NOSONAR
        }
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (!el) {
            // console.debug('getElementById failed for key:', key)
            continue
        }
        if (el.tagName !== 'INPUT') {
            el.textContent = value.toString()
        } else if (typeof value === 'boolean') {
            el.checked = value
        } else {
            el.value = value
        }
        if (el.dataset.related) {
            hideShowElement(`#${el.dataset.related}`, value)
        }
    }
}

/**
 * Hide or Show Element with JQuery
 * @function hideShowElement
 * @param {String} selector
 * @param {Boolean} [show]
 * @param {String} [speed]
 */
function hideShowElement(selector, show, speed = 'fast') {
    const element = $(`${selector}`)
    // console.debug('hideShowElement:', show, element)
    if (show) {
        element.show(speed)
    } else {
        element.hide(speed)
    }
}

/**
 * Link Click Callback
 * Note: Firefox popup requires a call to window.close()
 * @function linkClick
 * @param {MouseEvent} event
 * @param {Boolean} [close]
 */
export async function linkClick(event, close = false) {
    console.debug('linkClick:', close, event)
    event.preventDefault()
    const href = event.currentTarget.getAttribute('href').replace(/^\.+/g, '')
    console.debug('href:', href)
    let url
    if (href.startsWith('#')) {
        console.debug('return on anchor link')
        return
    } else if (href.endsWith('html/options.html')) {
        await chrome.runtime.openOptionsPage()
        if (close) window.close()
        return
    } else if (href.endsWith('html/panel.html')) {
        await openExtPanel()
        if (close) window.close()
        return
    } else if (href.endsWith('html/sidepanel.html')) {
        await openSidePanel()
        if (close) window.close()
        return
    } else if (href.startsWith('http')) {
        url = href
    } else {
        url = chrome.runtime.getURL(href)
    }
    console.debug('url:', url)
    await activateOrOpen(url)
    if (close) window.close()
}

/**
 * Activate or Open Tab from URL
 * @function activateOrOpen
 * @param {String} url
 * @param {Boolean} [open]
 * @return {Promise<chrome.tabs.Tab>}
 */
export async function activateOrOpen(url, open = true) {
    console.debug('activateOrOpen:', url, open)
    // Get Tab from Tabs (requires host permissions)
    const tabs = await chrome.tabs.query({ currentWindow: true })
    console.debug('tabs:', tabs)
    for (const tab of tabs) {
        if (tab.url === url) {
            console.debug('found tab in tabs:', tab)
            return await chrome.tabs.update(tab.id, { active: true })
        }
    }
    if (open) {
        console.debug('tab not found, opening url:', url)
        return await chrome.tabs.create({ active: true, url })
    }
    console.warn('tab not found and open not set!')
}

/**
 * Update DOM with Manifest Details
 * @function updateManifest
 */
export async function updateManifest() {
    const manifest = chrome.runtime.getManifest()
    document.querySelectorAll('.version').forEach((el) => {
        el.textContent = manifest.version
    })
    document.querySelectorAll('[href="homepage_url"]').forEach((el) => {
        el.href = manifest.homepage_url
    })
    document.querySelectorAll('[href="version_url"]').forEach((el) => {
        el.href = `${githubURL}/releases/tag/${manifest.version}`
    })
}

/**
 * Check Host Permissions
 * @function checkPerms
 * @return {Promise<Boolean>}
 */
export async function checkPerms() {
    const hasPerms = await chrome.permissions.contains({
        origins: ['https://github.com/*', 'https://codeberg.org/*'],
    })
    console.debug('checkPerms:', hasPerms)
    // Firefox still uses DOM Based Background Scripts
    if (typeof document === 'undefined') {
        return hasPerms
    }
    const hasPermsEl = document.querySelectorAll('.has-perms')
    const grantPermsEl = document.querySelectorAll('.grant-perms')
    if (hasPerms) {
        hasPermsEl.forEach((el) => el.classList.remove('d-none'))
        grantPermsEl.forEach((el) => el.classList.add('d-none'))
    } else {
        grantPermsEl.forEach((el) => el.classList.remove('d-none'))
        hasPermsEl.forEach((el) => el.classList.add('d-none'))
    }
    return hasPerms
}

/**
 * Grant Permissions Click Callback
 * @function grantPerms
 * @param {MouseEvent} event
 * @param {Boolean} [close]
 */
export async function grantPerms(event, close = false) {
    console.debug('grantPerms:', event)
    // noinspection ES6MissingAwait
    requestPerms()
    if (close) {
        window.close()
    }
}

/**
 * Request Host Permissions
 * @function requestPerms
 * @return {Promise<Boolean>}
 */
export async function requestPerms() {
    return await chrome.permissions.request({
        origins: ['https://github.com/*', 'https://codeberg.org/*'],
    })
}

/**
 * Revoke Permissions Click Callback
 * Note: This method does not work on Chrome if permissions are required.
 * @function revokePerms
 * @param {MouseEvent} event
 */
export async function revokePerms(event) {
    console.debug('revokePerms:', event)
    const permissions = await chrome.permissions.getAll()
    console.debug('permissions:', permissions)
    try {
        await chrome.permissions.remove({
            origins: permissions.origins,
        })
        await checkPerms()
    } catch (e) {
        console.log(e)
        showToast(e.toString(), 'danger')
    }
}

/**
 * Permissions On Added Callback
 * @param {chrome.permissions} permissions
 */
export async function onAdded(permissions) {
    console.debug('onAdded', permissions)
    await checkPerms()
}

/**
 * Permissions On Removed Callback
 * @param {chrome.permissions} permissions
 */
export async function onRemoved(permissions) {
    console.debug('onRemoved', permissions)
    await checkPerms()
}

/**
 * Open Extension Panel
 * @function openExtPanel
 * @param {String} [url]
 * @param {Number} [width]
 * @param {Number} [height]
 * @return {Promise<chrome.windows.Window>}
 */
export async function openExtPanel(
    url = '/html/panel.html',
    width = 1280,
    height = 720
) {
    console.debug(`openExtPanel: ${url}`, width, height)
    const windows = await chrome.windows.getAll({ populate: true })
    for (const window of windows) {
        // console.debug('window:', window)
        if (window.tabs[0]?.url?.endsWith(url)) {
            console.debug(`%c Panel found: ${window.id}`, 'color: Lime')
            return chrome.windows.update(window.id, { focused: true })
        }
    }
    return chrome.windows.create({ type: 'panel', url, width, height })
}

/**
 * Open Side Panel Callback
 * @function openSidePanel
 * @param {Event} [event]
 * @param {String} [url]
 */
export async function openSidePanel(event, url = '/html/sidepanel.html') {
    console.debug('openSidePanel:', event, url)
    if (chrome.sidePanel) {
        console.debug('%c Chrome', 'color: LightBlue')
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.sidePanel.open({ windowId: tab.windowId })
            console.debug('Set Panel path url:', url)
            chrome.sidePanel.setOptions({ path: url })
        })
    } else if (chrome.sidebarAction) {
        console.debug('%c Firefox', 'color: Orange')
        await chrome.sidebarAction.open()
        console.debug('Set Panel path url:', url)
        await chrome.sidebarAction.setPanel({ panel: url })
        // chrome.sidebarAction
        //     .getPanel({})
        //     .then(chrome.sidebarAction.setPanel({ panel: url }))
        // chrome.sidebarAction
        //     .open()
        //     .then(() => chrome.sidebarAction.setPanel({ panel: url }))
        // setTimeout((url) => {
        //     console.debug('%c setTimeout:', 'color: Yellow', url)
        //     chrome.sidebarAction.setPanel({ panel: url })
        // }, 100)
    } else {
        console.log('Side Panel Not Supported')
        if (event) {
            showToast('Side Panel Not Supported', 'danger')
            return
        }
    }
    // TODO: Gotta figure out how to set URL dynamically
    // await chrome.runtime.sendMessage({ setSidePanel: url })
    if (event) {
        console.debug('%c CLOSE WINDOW', 'color: OrangeRed')
        window.close()
    }
    // if (typeof window !== 'undefined') {
    //     window.close()
    // }
}

/**
 * Show Bootstrap Toast
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
export function showToast(message, type = 'primary') {
    console.debug(`showToast: ${type}: ${message}`)
    const clone = document.querySelector('#clone > .toast')
    const container = document.getElementById('toast-container')
    if (!clone || !container) {
        return console.warn('Missing clone or container:', clone, container)
    }
    const element = clone.cloneNode(true)
    element.querySelector('.toast-body').textContent = message
    element.classList.add(`text-bg-${type}`)
    container.appendChild(element)
    const toast = new bootstrap.Toast(element)
    element.addEventListener('mousemove', () => toast.hide())
    toast.show()
}

/**
 * Inject Function into Current Tab with args
 * @function injectFunction
 * @param {Function} func
 * @param {Array} [args]
 * @return {Promise<chrome.scripting.InjectionResult.result>}
 */
export async function injectFunction(func, args) {
    try {
        const [tab] = await chrome.tabs.query({
            currentWindow: true,
            active: true,
        })
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            injectImmediately: true,
            func: func,
            args: args,
        })
        console.debug('results:', results)
        const result = results[0]?.result
        console.debug('result:', result)
        return result
    } catch (e) {
        console.log(e)
    }
}

export async function injectScript() {
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/js/content/codeberg.js'],
    })
    console.debug('results:', results)
    const result = results[0]?.result
    console.debug('result:', result)
    return result
}

/**
 * Copy Text of ctx.linkText or from Active Element
 * Note: Chrome does not support ctx.linkText
 * @function copyActiveElementText
 * @param {OnClickData} ctx
 */
export function copyActiveElementText(ctx) {
    console.debug('copyActiveElementText:', ctx)
    let text =
        ctx.linkText?.trim() ||
        document.activeElement.innerText?.trim() ||
        document.activeElement.title?.trim() ||
        document.activeElement.firstElementChild?.alt?.trim() ||
        document.activeElement.ariaLabel?.trim()
    console.log('text:', text)
    if (text?.length) {
        navigator.clipboard.writeText(text).then()
    } else {
        console.log('%cNo Text to Copy.', 'color: Yellow')
    }
}

/**
 * Copy Image SRC of document.activeElement.querySelector img
 * Note: This is injected because Chrome SW has no DOM and requires offscreen
 * @function copyActiveImageSrc
 * @param {OnClickData} ctx
 */
export function copyActiveImageSrc(ctx) {
    console.debug('copyActiveImageSrc:', ctx.srcUrl)
    navigator.clipboard.writeText(ctx.srcUrl).then()
    // console.debug('copyActiveElementText:', ctx, document.activeElement)
    // const img = document.activeElement.querySelector('img')
    // if (!img?.src) {
    //     return console.log('Image not found or no src.', img)
    // }
    // console.log('img.src:', img.src)
    // navigator.clipboard.writeText(img.src).then()
}

/**
 * Toggle Site Handler
 * @function toggleSite
 * @param {String} hostname
 * @return {Promise<Boolean|undefined>} true if enabled
 */
export async function toggleSite(hostname) {
    console.debug('toggleSite:', hostname)
    if (!hostname) {
        console.warn('No hostname:', hostname)
        return
    }
    let changed
    let enabled = false
    const { sites } = await chrome.storage.sync.get(['sites'])
    // if (!(hostname in sites)) {
    if (!sites.includes(hostname)) {
        console.log(`Enabling Site: ${hostname}`)
        // sites[hostname] = {}
        sites.push(hostname)
        changed = true
        enabled = true
    } else {
        console.log(`Disabling Site: ${hostname}`)
        // delete sites[hostname]
        sites.splice(sites.indexOf(hostname), 1)
        changed = true
    }
    if (changed) {
        sites.sort()
        await chrome.storage.sync.set({ sites })
        console.debug('changed sites:', sites)
    }
    return enabled
}

// /**
//  * Enable Site Handler
//  * @param {String} hostname
//  * @param {Boolean} [enabled]
//  */
// export async function enableSite(hostname, enabled = true) {
//     console.debug(`toggleSite: ${hostname}`, enabled)
//     if (!hostname) {
//         return console.warn('No hostname:', hostname)
//     }
//     const { sites } = await chrome.storage.sync.get(['sites'])
//     let changed = false
//     if (enabled) {
//         // if (!(hostname in sites)) {
//         if (!sites.includes(hostname)) {
//             // sites[hostname] = {}
//             sites.push(hostname)
//             console.debug('added:', hostname)
//             changed = true
//         }
//         // } else if (hostname in sites) {
//     } else if (sites.includes(hostname)) {
//         // delete sites[hostname]
//         const idx = sites.indexOf(hostname)
//         const removed = sites.splice(idx, 1)
//         console.debug('removed:', removed)
//         changed = true
//     }
//     if (changed) {
//         // noinspection JSIgnoredPromiseFromCall
//         await chrome.storage.sync.set({ sites })
//         console.debug('changed sites:', sites)
//     }
// }

/**
 * Generic Click Events Handler
 * dataset.showHide, dataset.copyInput
 * @function clickEvents
 * @param {MouseEvent} event
 */
export function clickEvents(event) {
    console.debug('clickEvents:', event)
    const target = event.currentTarget
    console.debug('target:', target)
    if (target.dataset.showHide) {
        const input = document.querySelector(target.dataset.showHide)
        console.debug('input:', input)
        if (input.type === 'password') {
            input.type = 'text'
        } else {
            input.type = 'password'
        }
    } else if (target.dataset.copyInput) {
        const input = document.querySelector(target.dataset.copyInput)
        console.debug('input:', input)
        if (!input?.value) {
            return showToast('No Data to Copy.', 'warning')
        }
        // noinspection JSIgnoredPromiseFromCall
        navigator.clipboard.writeText(input.value)
        showToast(target.dataset.copyText || 'Copied to Clipboard.')
    }
}

export async function updateRepos(options) {
    console.debug('updateRepos:', options)
    console.debug('%c Cleared repos', 'color: Lime')
    await chrome.storage.local.set({ repos: {} })
    if (!options.ghToken) {
        console.warn('Missing: options.ghToken')
        return
    }
    const github = new Github(options.ghToken)
    const data = await github.getRepos()
    console.debug('data:', data)
    const repos = {}
    data.forEach((repo) => {
        // console.debug('repo:', repo)
        repos[repo.full_name] = repo
    })
    await chrome.storage.local.set({ repos })
    console.debug('%c Repos Updated.', 'color: Lime')
    return repos
}

export function handleAction(event) {
    console.debug('handleAction:', event)
    const target = event.currentTarget
    // console.debug('target:', target)
    if (target.classList.contains('disabled')) {
        return console.debug('disabled')
    }
    const action = target.dataset.action
    // console.debug('action:', action)
    const full_name = target.dataset.full_name
    // console.debug('full_name:', full_name)
    console.debug(`${action} - ${full_name}`)

    const url = new URL(chrome.runtime.getURL('/html/panels/actions.html'))
    url.searchParams.append('full_name', full_name)
    console.debug('url:', url)

    if (action === 'clone') {
        console.debug('%c Clone the NAGGERS', 'color: Yellow')
        url.searchParams.append('action', 'clone')
        openSidePanel(null, url.href)
    } else if (action === 'mirror') {
        console.debug('%c Mirror the DIGGERS', 'color: Lime')
        url.searchParams.append('action', 'mirror')
        openSidePanel(null, url.href)
    } else {
        console.warn(`Unknown Action: ${action}`)
    }
}

// function cloneRepo(event) {
//     console.debug('cloneRepo:', event)
//     event.preventDefault()
// }

// function mirrorRepo(event) {
//     console.debug('mirrorRepo:', event)
//     event.preventDefault()
//     const branch = target.dataset.branch
//     console.debug('branch:', branch)
// }
