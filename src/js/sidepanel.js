// JS for sidepanel.html

import {
    handleAction,
    linkClick,
    showToast,
    updateManifest,
    updateOptions,
    updateRepos,
} from './export.js'

chrome.storage.onChanged.addListener(onChanged)
// chrome.runtime.onMessage.addListener(onMessage)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.refresh-panel')
    .forEach((el) => el.addEventListener('click', refreshPanel))
document
    .querySelectorAll('.close-panel')
    .forEach((el) => el.addEventListener('click', closePanel))
document
    .querySelectorAll('[data-action]')
    .forEach((el) => el.addEventListener('click', handleAction))
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    // noinspection ES6MissingAwait
    updateManifest()

    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)

    try {
        if (!options.ghToken) {
            showError('No GitHub Token Configured in Options.')
            return
        }

        const { repos } = await chrome.storage.local.get(['repos'])
        console.debug('repos:', repos)
        genTable(repos)
    } catch (e) {
        console.debug('e:', e)
        showError(e.message)
    } finally {
        document.getElementById('table-loading').classList.add('d-none')
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    console.debug('onChanged:', changes, namespace)
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options') {
            updateOptions(newValue)
            if (oldValue.ghToken !== newValue.ghToken) {
                console.debug('Changed: ghToken:', newValue.ghToken)
                location.reload()
            }
        }
        if (namespace === 'local' && key === 'repos') {
            genTable(newValue)
        }
    }
}

// /**
//  * On Message Callback
//  * @function onMessage
//  * @param {Object} message
//  * @param {MessageSender} sender
//  * @param {Function} sendResponse
//  */
// function onMessage(message, sender, sendResponse) {
//     console.debug('onMessage:', message, sender)
//     if (message.target !== 'sidepanel') {
//         return console.debug('Not Sidepanel Message.')
//     }
// }

/**
 * Refresh Side Panel
 * Note: Panel auto-refreshes, this is only for server side changes.
 * @function refreshPanel
 * @param {Event} [event]
 */
async function refreshPanel(event) {
    console.debug('refreshPanel:', event)
    event?.preventDefault()
    // location?.reload()
    // TODO: Make this block a function
    const { options } = await chrome.storage.sync.get(['options'])
    if (!options.ghToken) {
        showToast('Missing GitHub Token.', 'warning')
        console.debug('%c Missing options.ghToken', 'color: Yellow')
    }
    try {
        await updateRepos(options)
    } catch (e) {
        showToast('Error Refreshing Repos!', 'warning')
        console.log(e)
    }
}

/**
 * Close Side Panel
 * @function closePanel
 * @param {Event} [event]
 */
async function closePanel(event) {
    console.debug('closePanel:', event)
    event?.preventDefault()
    if (typeof browser !== 'undefined') {
        await browser.sidebarAction.close()
    } else {
        window.close()
    }
}

function showError(message) {
    const alert = document.querySelector('div.alert-danger')
    alert.querySelector('div').textContent = message
    alert.classList.remove('d-none')
}

function genTable(data, id = 'repos-table') {
    console.debug(`genTable: ${id}:`, data)
    const tbody = document.getElementById(id)?.querySelector('tbody')
    if (!tbody) {
        return console.error('404: Table tbody not found!')
    }
    tbody.innerHTML = ''
    console.debug('tbody:', tbody)
    for (const [full_name, repo] of Object.entries(data)) {
        // console.debug(`full_name: ${full_name}`, repo)
        const row = tbody.insertRow()

        // Repo Link and Name
        const link = document.createElement('a')
        link.dataset.full_name = full_name
        link.text = full_name
        link.title = repo.description
        link.href = repo.html_url
        link.target = '_blank'
        link.setAttribute('role', 'button')
        // console.debug('link:', link)
        const linkCell = row.insertCell()
        linkCell.appendChild(link)
        row.appendChild(linkCell)

        // Clone Button
        const clone = document.createElement('a')
        clone.appendChild(
            document
                .querySelector('#clone > .fa-solid.fa-code-fork')
                .cloneNode(true)
        )
        clone.title = 'Clone'
        clone.dataset.action = 'clone'
        clone.dataset.full_name = repo.full_name
        clone.classList.add('link-success')
        // if (!repo.permissions?.push) {
        //     clone.classList.remove('link-success')
        //     clone.classList.add('disabled', 'link-secondary')
        // }
        clone.setAttribute('role', 'button')
        clone.addEventListener('click', handleAction)
        const cloneCell = row.insertCell()
        cloneCell.classList.add('text-center')
        cloneCell.appendChild(clone)

        // Mirror Button
        const mirror = document.createElement('a')
        mirror.appendChild(
            document
                .querySelector('#clone > .fa-regular.fa-clone')
                .cloneNode(true)
        )
        mirror.title = 'Mirror'
        mirror.dataset.action = 'mirror'
        mirror.dataset.full_name = repo.full_name
        mirror.classList.add('link-info')
        if (!repo.permissions?.push) {
            mirror.classList.remove('link-info')
            mirror.classList.add('disabled', 'link-secondary')
        }
        mirror.setAttribute('role', 'button')
        mirror.addEventListener('click', handleAction)
        const mirrorCell = row.insertCell()
        mirrorCell.classList.add('text-center')
        mirrorCell.appendChild(mirror)
    }
}
