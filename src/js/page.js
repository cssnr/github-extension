// JS for page.html

import axios from '../dist/axios/axios.js'

import {
    checkPerms,
    grantPerms,
    linkClick,
    onAdded,
    onRemoved,
    revokePerms,
} from './export.js'

chrome.permissions.onAdded.addListener(onAdded)
chrome.permissions.onRemoved.addListener(onRemoved)

document.addEventListener('DOMContentLoaded', domContentLoaded)
document
    .querySelectorAll('.revoke-permissions')
    .forEach((el) => el.addEventListener('click', revokePerms))
document
    .querySelectorAll('.grant-permissions')
    .forEach((el) => el.addEventListener('click', grantPerms))
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    // noinspection ES6MissingAwait
    checkPerms()
    chrome.storage.sync.get(['options']).then((items) => {
        console.debug('options:', items.options)
    })
    axios
        .get('https://httpbin.org/get')
        .then(function (response) {
            console.log('response:', response)
        })
        .catch(function (error) {
            // handle error
            console.log('error:', error)
        })
        .finally(function () {
            console.log('done')
        })
    // try {
    //     const response = await axios.get('https://httpbin.org/get')
    //     console.debug('response.data:', response.data)
    // } catch (e) {
    //     console.log('error:', e)
    // }
}
