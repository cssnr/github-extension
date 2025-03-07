// Codeberg API

export class Codeberg {
    constructor(token, host = 'https://codeberg.org/') {
        host = host.replace(/\/$/, '')
        if (!host.endsWith('api/v1')) {
            host += '/api/v1'
        }
        this.host = host
        this.token = token
        this.options = {
            headers: {
                Authorization: `token ${this.token}`,
            },
        }
    }

    async getUser() {
        const response = await fetch(this.host + '/user', this.options)
        console.debug('response:', response)
        const json = await response.json()
        console.debug('json:', json)
        return json
    }

    // async getRepo(owner, repo) {
    //     const response = await this.client.get(`/repos/${owner}/${repo}`)
    //     return response.data
    // }
}
