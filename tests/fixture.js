// Local test server only; never loaded by production HTML.
const fixtureRole = new URLSearchParams(location.search).get('fixture');
window.musicSupabase = {
    configured: true, bucket: 'music-files', client: {
        auth: {
            getSession: async () => ({ data: { session: ['admin', 'user'].includes(fixtureRole) ? { user: { id: 'test-user', email: 'test@example.test' } } : null } }),
            signInWithPassword: async () => ({ error: { message: 'Invalid login' } }),
            signUp: async () => ({ data: { session: null } }),
            signOut: async () => ({ error: null })
        },
        from(table) {
            const result = async () => table === 'profiles'
                ? { data: { role: fixtureRole, name: 'Test dinleyici' } }
                : { data: (await (await fetch('assets/data/songs.json')).json()).map((song, index) => ({ ...song, status: index % 3 ? 'approved' : 'pending', profiles: { name: 'Test dinleyici' } })) };
            const query = { select: () => query, eq: () => query, order: () => query, abortSignal: () => query, maybeSingle: result, then: (resolve, reject) => result().then(resolve, reject) };
            return query;
        },
        functions: { invoke: async () => ({ data: { items: [] } }) }
    }
};
