// Pure, shared validation. Keep browser and database validation in agreement.
(function (root) {
    /** @param {unknown} value */
    function normalizeText(value) {
        return String(value ?? '').toLocaleLowerCase('tr-TR').normalize('NFKD')
            .replace(/\p{Diacritic}/gu, '').replace(/ı/g, 'i').trim();
    }

    /** @param {unknown} value @param {string} base */
    function safeMediaUrl(value, base) {
        if (!value) return '';
        try {
            const url = new URL(String(value), base);
            if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
            return url.href;
        } catch { return ''; }
    }

    /** @param {{name: string, size: number, type: string}} file @param {string} folder */
    function validateUpload(file, folder) {
        const covers = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const music = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac'];
        const limit = folder === 'albums' ? 10 : 50;
        if (!file.size || file.size > limit * 1024 * 1024) throw new Error(`Dosya boş olmamalı ve en fazla ${limit} MB olabilir.`);
        if (!(folder === 'albums' ? covers : music).includes(file.type)) {
            throw new Error(folder === 'albums' ? 'Kapak için JPG, PNG, GIF veya WebP seçin.' : 'MP3, WAV, OGG, M4A, AAC veya FLAC dosyası seçin.');
        }
    }

    root.MusicCore = { normalizeText, safeMediaUrl, validateUpload };
})(/** @type {typeof globalThis & {MusicCore?: {normalizeText: (value: unknown) => string, safeMediaUrl: (value: unknown, base: string) => string, validateUpload: (file: {name:string,size:number,type:string}, folder:string) => void}}} */ (globalThis));
