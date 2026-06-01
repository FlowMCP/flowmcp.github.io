// src/lib/featured.mjs
// Single Source fuer den gefeatureten Blogpost (Memo 088 Kap. 8, F7).
// Genutzt von BlogIndexLayout.astro UND Hero.astro (via Pill).

const selectFeatured = ( { posts } ) => {
    const flagged = posts
        .filter( ( post ) => post.data.featured === true )

    // Bewusster Fallback (kein stiller Default): wenn kein/mehrere Flags,
    // gilt der neueste Post. posts ist bereits date-desc sortiert.
    const featured = flagged.length === 1
        ? flagged[ 0 ]
        : posts[ 0 ]

    return { featured }
}

export { selectFeatured }
