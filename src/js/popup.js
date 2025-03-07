// JS for popup.html

import {
    checkPerms,
    grantPerms,
    handleAction,
    injectFunction,
    linkClick,
    saveOptions,
    // showToast,
    // toggleSite,
    updateManifest,
    updateOptions,
} from './export.js'

import { reserved } from './vars.js'

document.addEventListener('DOMContentLoaded', initPopup)
// document.getElementById('inject-script').addEventListener('click', injectScript)
document.querySelectorAll('[data-action]').forEach((el) =>
    el.addEventListener('click', (e) => {
        handleAction(e)
        window.close()
    })
)
// noinspection JSCheckFunctionSignatures
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', (e) => grantPerms(e, true)))
// noinspection JSCheckFunctionSignatures
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', (e) => linkClick(e, true)))
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

// const hostnameEl = document.getElementById('hostname')
// const switchEl = document.getElementById('switch')
// const toggleSiteEl = document.getElementById('toggle-site')
// toggleSiteEl.addEventListener('change', toggleSiteChange)

/**
 * Initialize Popup
 * @function initPopup
 */
async function initPopup() {
    console.debug('initPopup')
    // noinspection ES6MissingAwait
    updateManifest()
    chrome.storage.sync.get(['options']).then((items) => {
        console.debug('options:', items.options)
        updateOptions(items.options)
    })

    // Check Host Permissions
    const hasPerms = await checkPerms()
    if (!hasPerms) {
        return console.log('%c Host Permissions Not Granted', 'color: Red')
    }

    // Check Tab Permissions
    const siteInfo = await injectFunction(() => {
        const els = document.querySelectorAll(
            'script[type="application/json"][data-target="react-partial.embeddedData"]'
        )
        const data = JSON.parse(els[els.length - 1]?.textContent || '{}')
        return { location: { ...window.location }, data: data }
    })
    console.debug('siteInfo:', siteInfo)
    if (!siteInfo) {
        document
            .querySelectorAll('.tab-perms')
            .forEach((el) => el.classList.add('d-none'))
        // switchEl.classList.replace('border-secondary', 'border-danger')
        return console.log('%c No Tab Permissions', 'color: Yellow')
    }
    if (!['github.com'].includes(siteInfo.location.hostname)) {
        return console.log('%c Host not Supported', 'color: Yellow')
    }

    console.debug('%c Valid Host:', 'color: Lime', siteInfo.location.hostname)

    // chrome.cookies
    //     .get({
    //         url: siteInfo.location.href,
    //         name: 'logged_in',
    //     })
    //     .then((cookie) => {
    //         console.debug('%c cookie:', 'color: Yellow', cookie)
    //         const loggedIn = cookie?.value === 'yes'
    //         console.debug('loggedIn:', loggedIn)
    //         if (!loggedIn) {
    //             document.getElementById('logged-in').classList.remove('d-none')
    //         }
    //     })

    // Check Logged In Cookie
    const cookieDetails = { url: siteInfo.location.href, name: 'logged_in' }
    console.debug('cookieDetails:', cookieDetails)
    const cookie = await chrome.cookies.get(cookieDetails)
    console.debug('%c cookie.value:', 'color: Yellow', cookie.value)
    const loggedIn = cookie?.value === 'yes'
    console.debug('loggedIn:', loggedIn)
    if (!loggedIn) {
        document.getElementById('logged-in').classList.remove('d-none')
        console.debug('%c Not Logged In to GitHub!', 'color: OrangeRed')
    }

    // Parse Repo Info from Pathname
    const info = validateRepoName(siteInfo.location.pathname)
    console.debug('info:', info)
    if (!info) {
        return console.debug('%c No Repo Found!', 'color: Yellow')
    }

    // Update Repo Border and Text
    const el = document.getElementById('repo')
    el.classList.replace('border-secondary', 'border-warning')
    el.querySelector('kbd').textContent = info.full_name

    // Enable Clone Button
    const cloneBtn = document.getElementById('clone-repository')
    cloneBtn.dataset.full_name = info.full_name
    cloneBtn.classList.remove('disabled')

    // Check if Repo is in User Repos
    const { repos } = await chrome.storage.local.get(['repos'])
    console.debug('repos:', repos)
    let repo = repos[info.full_name]
    console.debug('repo:', repo)
    console.log('%c repo:', 'color: Magenta', repo)

    // Repo is NOT in User Repos
    if (!repo) {
        return console.debug('%c repo not in repos', 'color: OrangeRed')
    }

    // Enable Mirror Button
    const mirrorBtn = document.getElementById('mirror-repository')
    mirrorBtn.dataset.full_name = info.full_name
    mirrorBtn.classList.remove('disabled')
    // Update Repo Border
    el.classList.replace('border-warning', 'border-success')

    // const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
    // console.debug('tab:', tab)

    // const tabs = await chrome.tabs.query({ highlighted: true })
    // console.log('tabs:', tabs)

    // const views = chrome.extension.getViews()
    // console.log('views:', views)

    // const platform = await chrome.runtime.getPlatformInfo()
    // console.debug('platform:', platform)
}

function validateRepoName(pathname) {
    const split = pathname.split('/')
    console.debug('split:', split)
    const owner = split[1]
    const repo = split[2]

    if (!split || !owner || !repo) {
        console.debug('validRepoName: missing split or component(s)')
        return
    }

    if (reserved.includes(owner)) {
        console.debug('validRepoName: username is reserved')
        return
    }

    const re = new RegExp(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i)
    if (!re.test(owner)) {
        console.debug('validRepoName: username regex failed')
        return
    }

    const full_name = `${owner}/${repo}`
    console.debug('full_name:', full_name)
    // const url = `https://api.github.com/repos/${full_name}`
    // console.debug('url:', url)
    return {
        repo,
        owner,
        full_name,
    }
}

// /**
//  * Grant Permissions Button Click Callback
//  * @function injectScript
//  * @param {MouseEvent} event
//  */
// async function injectScript(event) {
//     console.debug('injectScript:', event)
//     const [tab] = await chrome.tabs.query({ currentWindow: true, active: true })
//     try {
//         const result = await chrome.scripting.executeScript({
//             target: { tabId: tab.id },
//             files: ['/js/inject.js'],
//         })
//         console.debug('Injection Result:', result)
//         window.close()
//     } catch (e) {
//         showToast(e.toString(), 'danger')
//         console.log(e)
//     }
// }

// /**
//  * Toggle Site Change Callback
//  * @function toggleSiteChange
//  * @param {InputEvent} event
//  */
// async function toggleSiteChange(event) {
//     console.debug('toggleSiteChange:', event)
//     const hostname = hostnameEl.textContent
//     const enabled = await toggleSite(hostname)
//     if (enabled) {
//         switchEl.classList.replace('border-secondary', 'border-success')
//     } else {
//         switchEl.classList.replace('border-success', 'border-secondary')
//     }
// }
