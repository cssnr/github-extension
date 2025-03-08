// JS for sidepanel.html

// import { Octokit } from '../../dist/octokit/octokit.js'
import { Github } from '../api/github.js'
import mustache from '../../dist/mustache/mustache.mjs'

import { linkClick, showToast, updateManifest } from '../export.js'

document.addEventListener('DOMContentLoaded', domContentLoaded)
document.getElementById('mirror-repo').addEventListener('click', mirrorRepo)
document
    .querySelectorAll('.close-panel')
    .forEach((el) => el.addEventListener('click', closePanel))
document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))

const searchParams = new URLSearchParams(window.location.search)

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    // noinspection ES6MissingAwait
    updateManifest()

    // chrome.storage.sync.get(['options']).then((items) => {
    //     // console.debug('options:', items.options)
    //     updateOptions(items.options)
    // })

    const { options } = await chrome.storage.sync.get(['options'])

    const full_name = searchParams.get('full_name')
    console.debug('full_name:', full_name)
    const split = full_name.split('/')
    const owner = split[0]
    console.debug('owner:', owner)
    const repo = split[1]
    console.debug('repo:', repo)

    console.debug('options.defaultMirrorUser:', options.defaultMirrorUser)

    document.getElementById('owner').value = options.defaultMirrorUser || owner
    // document.getElementById('name').value = repo

    const action = searchParams.get('action')
    console.debug('action:', action)

    if (action === 'clone') {
        console.debug('%c CLONE, Naggers right?', 'color: Yellow')
        document.getElementById('cloneEL').classList.remove('d-none')
    } else if (action === 'mirror') {
        console.debug('%c MIRROR, Diggers right?', 'color: OrangeRed')
        document.getElementById('mirrorEl').classList.remove('d-none')
    } else {
        console.debug('%c UNKNOWN ACTION:', 'color: Red', action)
    }
    console.debug('%c Success, so far...', 'color: Lime')
}

/**
 * Mirror Repository Click Callback
 * @function mirrorRepo
 * @param {Event} [event]
 */
async function mirrorRepo(event) {
    console.debug('mirrorRepo:', event)
    event?.preventDefault()

    // try {

    const full_name = searchParams.get('full_name')
    console.debug('full_name:', full_name)
    const split = full_name.split('/')
    const owner = split[0]
    console.debug('owner:', owner)
    const repo = split[1]
    console.debug('repo:', repo)

    const host = document.getElementById('host').value
    const destOwner = document.getElementById('owner').value || owner
    const destName = document.getElementById('name').value
    const { options } = await chrome.storage.sync.get(['options'])
    const github = new Github(options.ghToken)

    // Check if Workflow Exists
    const workflows = await github.getWorkflows(owner, repo)
    console.debug('workflows:', workflows)
    if (workflows?.data) {
        for (const workflow of workflows.data) {
            if (workflow.name === 'mirror.yaml') {
                showToast('Workflow Exists: mirror.yaml', 'danger')
                return
            }
        }
    }

    // Check if Secret Exists
    const secrets = await github.getSecrets(owner, repo)
    console.debug('secrets:', secrets)
    const secretExists = secrets.some(
        (secret) => secret.name === 'CODEBERG_TOKEN'
    )
    if (secretExists) {
        console.log('%c CODEBERG_TOKEN exists.', 'color: Lime')
    } else {
        console.log('%c CODEBERG_TOKEN not found!', 'color: Yellow')
    }

    // Otherwise Add Secret
    if (!secretExists) {
        await github.addSecret(owner, repo, 'CODEBERG_TOKEN', options.cbToken)
        console.log('%c Created Secret: CODEBERG_TOKEN', 'color: Orange')
    }

    // Get Mustache Template
    const url = chrome.runtime.getURL('/js/templates/mirror.yaml.mustache')
    // console.debug('url:', url)
    const response = await fetch(url)
    // console.debug('response:', response)
    const text = await response.text()
    // console.debug('text:', text)
    const view = {
        // url: url,
        host: host,
        owner: destOwner,
        repo: destName,
        username: options.cbUsername,
        token: '${{ secrets.CODEBERG_TOKEN }}',
    }
    // console.debug('data:', data)
    const output = mustache.render(text, view)
    console.debug(output)

    // Add to Repo
    const data = {
        owner,
        repo,
        path: '.github/workflows/mirror.yaml',
        message: 'Adding Mirror Workflow.',
        content: btoa(output),
    }
    const resp = await github.addFile(data)
    console.debug('resp:', resp)

    // } catch (e) {
    //     console.error(e)
    //     showToast(e.message, 'danger')
    // }
}

/**
 * Close Side Panel
 * @function closePanel
 * @param {Event} [event]
 */
async function closePanel(event) {
    console.debug('closePanel:', event)
    event?.preventDefault()
    // noinspection JSUnresolvedReference
    if (typeof browser !== 'undefined') {
        // noinspection JSUnresolvedReference
        await browser.sidebarAction.close()
    } else {
        window.close()
    }
}
