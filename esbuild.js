const esbuild = require('esbuild')

Promise.all([
    esbuild.build({
        entryPoints: ['node_modules/@octokit/rest/dist-src/index.js'],
        bundle: true,
        format: 'esm',
        outfile: './src/dist/octokit/octokit.js',
    }),
    esbuild.build({
        entryPoints: ['node_modules/axios/index.js'],
        bundle: true,
        format: 'esm',
        outfile: './src/dist/axios/axios.js',
    }),
]).catch(() => process.exit(1))
