const esbuild = require('esbuild')

// Bundle the core Octokit functionality
esbuild
    .build({
        entryPoints: ['node_modules/@octokit/rest/dist-src/index.js'],
        bundle: true,
        format: 'esm',
        outfile: './src/dist/octokit/bundle.js',
    })
    .catch(() => process.exit(1))
