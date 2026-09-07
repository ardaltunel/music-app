(function () {
    const config = window.MUSIC_SUPABASE_CONFIG || {};
    const url = String(config.url || '').trim();
    const anonKey = String(config.anonKey || '').trim();
    const configured = Boolean(
        window.supabase &&
        /^https:\/\/.+\.supabase\.co$/i.test(url) &&
        anonKey &&
        !anonKey.includes('YOUR_SUPABASE')
    );

    window.musicSupabase = {
        configured,
        bucket: config.storageBucket || 'music-files',
        client: configured ? window.supabase.createClient(url, anonKey) : null
    };
})();
