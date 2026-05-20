export const standardTags = [
    { slug: 'blockchain',      label: 'Blockchain',              cluster: 'crypto' },
    { slug: 'defi',            label: 'DeFi',                    cluster: 'crypto' },
    { slug: 'solana',          label: 'Solana',                  cluster: 'crypto' },
    { slug: 'evm',             label: 'EVM',                     cluster: 'crypto' },
    { slug: 'crypto-data',     label: 'Crypto Data',             cluster: 'crypto' },
    { slug: 'government-de',   label: 'Government DE',           cluster: 'government' },
    { slug: 'government-eu',   label: 'Government EU',           cluster: 'government' },
    { slug: 'analytics',       label: 'Analytics',               cluster: 'data' },
    { slug: 'nft-identity',    label: 'NFT & Identity',          cluster: 'web3' },
    { slug: 'weather-geo',     label: 'Weather & Geo',           cluster: 'data' },
    { slug: 'web3-social',     label: 'Web3 Social',             cluster: 'web3' },
    { slug: 'news-media',      label: 'News & Media',            cluster: 'data' },
    { slug: 'dev-tools',       label: 'Dev Tools & Utilities',   cluster: 'tools' },
    { slug: 'other',           label: 'Other',                   cluster: 'misc' },
]

export const tagBySlug = ( slug ) => standardTags.find( ( t ) => t.slug === slug ) ?? null

export const tagsByCluster = ( cluster ) => standardTags.filter( ( t ) => t.cluster === cluster )

export const allClusters = [ ...new Set( standardTags.map( ( t ) => t.cluster ) ) ]
