import { Octokit } from '../../dist/octokit/octokit.js'

// import _sodium from '../../dist/libsodium/libsodium.js'

export class Github {
    /**
     * @class Github
     * @param {String} token
     * @param {String} [baseUrl]
     */
    constructor(token, baseUrl) {
        this.token = token
        const options = { auth: token }
        if (baseUrl) {
            options.baseUrl = baseUrl
        }
        this.octokit = new Octokit(options)

        // this.sodium = null
        // _sodium.ready.then(() => {
        //     this.sodium = _sodium
        // })
    }

    /**
     * @method getUser
     * @return {Promise<*>}
     */
    async getUser() {
        const response = await this.octokit.rest.users.getAuthenticated()
        console.debug('response:', response)
        return response.data
    }

    /**
     * @method getRepo
     * @param {String} owner
     * @param {String} repo
     * @return {Promise<*>}
     */
    async getRepo(owner, repo) {
        const response = await this.octokit.rest.repos.get({
            owner,
            repo,
        })
        console.debug('response:', response)
        return response.data
    }

    /**
     * @method getRepos
     * @return {Promise<*[]>}
     */
    async getRepos() {
        console.debug('getRepos')
        const repos = []
        let page = 1
        const per_page = 100 // Maximum per page
        while (true) {
            const response =
                await this.octokit.rest.repos.listForAuthenticatedUser({
                    per_page,
                    page,
                })
            console.debug('response:', response)
            repos.push(...response.data)
            if (!response.headers.link?.includes('rel="next"')) {
                break
            }
            page++
        }
        return repos
    }

    async getSecrets(owner, repo) {
        const { data: secrets } =
            await this.octokit.rest.actions.listRepoSecrets({
                owner,
                repo,
            })
        return secrets.secrets
    }

    async addSecret(owner, repo, secret_name, secret) {
        // await _sodium.ready
        // const sodium = _sodium
        // console.debug('sodium:', sodium)

        // window.sodium = {
        //     onload: function (sodium) {
        //         let h = sodium.crypto_generichash(
        //             64,
        //             sodium.from_string('test')
        //         )
        //         console.log(sodium.to_hex(h))
        //     },
        // }

        const {
            data: { key_id, key },
        } = await this.octokit.rest.actions.getRepoPublicKey({
            owner,
            repo,
        })
        console.debug('key_id:', key_id)
        console.debug('key:', key)

        const url = 'https://intranet.cssnr.com/github/encrypt'
        const options = {
            method: 'POST',
            body: JSON.stringify({ key, secret }),
        }
        const response = await fetch(url, options)
        console.debug('response:', response)
        const encrypted_value = await response.text()
        console.debug('encrypted_value:', encrypted_value)

        // // let binkey = sodium.from_base64(secret_name, sodium.base64_variants.ORIGINAL)
        // let binsec = sodium.from_string(secret)
        //
        // // Encrypt the secret using libsodium
        // let encBytes = sodium.crypto_box_seal(binsec, key)
        //
        // // Convert the encrypted Uint8Array to Base64
        // let encrypted_value = sodium.to_base64(
        //     encBytes,
        //     sodium.base64_variants.ORIGINAL
        // )
        // console.debug('encrypted_value:', encrypted_value)

        // Create or update the secret
        await this.octokit.rest.actions.createOrUpdateRepoSecret({
            owner,
            repo,
            secret_name,
            encrypted_value,
            key_id,
        })

        console.log(`Secret ${secret_name} has been set.`)

        // sodium.ready.then(() => {
        //     // Convert the secret and key to a Uint8Array.
        //     let binkey = sodium.from_base64(
        //         name,
        //         sodium.base64_variants.ORIGINAL
        //     )
        //     let binsec = sodium.from_string(secret)
        //
        //     // Encrypt the secret using libsodium
        //     let encBytes = sodium.crypto_box_seal(binsec, binkey)
        //
        //     // Convert the encrypted Uint8Array to Base64
        //     let output = sodium.to_base64(
        //         encBytes,
        //         sodium.base64_variants.ORIGINAL
        //     )
        //
        //     // Print the output
        //     console.log(output)
        // })
    }

    // async addSecret(owner, repo, name, secret) {
    //     const {
    //         data: { key_id, key },
    //     } = await this.octokit.rest.actions.getRepoPublicKey({
    //         owner,
    //         repo,
    //     })
    //     console.debug('key_id:', key_id)
    //     console.debug('key:', key)
    //     // Encrypt the secret value
    //     const encodedSecret = Buffer.from(secret).toString('base64')
    //     console.debug('encodedSecret:', encodedSecret)
    //     const encryptedSecret = crypto.publicEncrypt(
    //         {
    //             key: Buffer.from(key, 'base64').toString(),
    //             padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    //             oaepHash: 'sha256',
    //         },
    //         Buffer.from(encodedSecret)
    //     )
    //     console.debug('encryptedSecret:', encryptedSecret)
    //     // Create or update the secret
    //     await this.octokit.rest.actions.createOrUpdateRepoSecret({
    //         owner,
    //         repo,
    //         secret_name: name,
    //         encrypted_value: encryptedSecret.toString('base64'),
    //         key_id,
    //     })
    // }

    // async addSecret(owner, repo, name, secret) {
    //     // Get the public key for the repository
    //     const {
    //         data: { key_id, key },
    //     } = await this.octokit.rest.actions.getRepoPublicKey({
    //         owner,
    //         repo,
    //     })
    //     console.debug('key_id:', key_id)
    //     console.debug('key:', key)
    //
    //     // Encrypt the secret value using the public key
    //     const encryptedSecret = await this.encryptSecret(key, secret)
    //     console.debug('encryptedSecret:', encryptedSecret)
    //
    //     // Create or update the secret
    //     await this.octokit.rest.actions.createOrUpdateRepoSecret({
    //         owner,
    //         repo,
    //         secret_name: name,
    //         encrypted_value: encryptedSecret,
    //         key_id,
    //     })
    //
    //     console.log(`Secret ${name} has been set.`)
    // }
    //
    // async encryptSecret(publicKey, secret) {
    //     // Decode the base64 public key
    //     const keyBuffer = Uint8Array.from(atob(publicKey), (c) =>
    //         c.charCodeAt(0)
    //     )
    //
    //     // Import the public key
    //     const importedKey = await window.crypto.subtle.importKey(
    //         'spki',
    //         keyBuffer,
    //         {
    //             name: 'RSA-OAEP',
    //             hash: { name: 'SHA-256' },
    //         },
    //         false,
    //         ['encrypt']
    //     )
    //
    //     // Encode the secret value
    //     const encodedSecret = new TextEncoder().encode(secret)
    //
    //     // Check if the secret is not empty
    //     if (encodedSecret.length === 0) {
    //         throw new Error('Secret value cannot be empty.')
    //     }
    //
    //     // Encrypt the secret value
    //     const encryptedSecret = await window.crypto.subtle.encrypt(
    //         { name: 'RSA-OAEP' },
    //         importedKey,
    //         encodedSecret
    //     )
    //
    //     // Convert the encrypted data to a base64 string
    //     return btoa(String.fromCharCode(...new Uint8Array(encryptedSecret)))
    // }

    /**
     * @method getWorkflows
     * @param {String} owner
     * @param {String} repo
     * @return {Promise<*>}
     */
    async getWorkflows(owner, repo) {
        console.debug('getWorkflows:', owner, repo)
        try {
            return await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path: '.github/workflows',
            })
        } catch (e) {
            console.log(e)
        }
    }

    async addFile(data) {
        return this.octokit.rest.repos.createOrUpdateFileContents(data)
    }
}
