export function vimeoEmbedURL(reference: string): string | undefined {
    const value = reference.trim();
    if (/^[1-9]\d*$/.test(value)) return `https://player.vimeo.com/video/${value}`;
    if (!value.startsWith("https://") || /[\s\\]/.test(value)) return;

    const url = URL.parse(value);
    if (!url || url.username || url.password || url.port) return;

    const match = url.hostname === "player.vimeo.com"
        ? /^\/video\/([1-9]\d*)\/?$/.exec(url.pathname)
        : /^(?:www\.)?vimeo\.com$/.test(url.hostname)
            ? /^\/([1-9]\d*)(?:\/([a-zA-Z0-9]+))?\/?$/.exec(url.pathname)
            : null;
    if (!match) return;

    const hashes = url.searchParams.getAll("h");
    const pathHash = match[2];
    if (hashes.length > 1 || (pathHash && hashes.length > 0)) return;
    const hash = pathHash ?? hashes[0];
    if (hash !== undefined && !/^[a-zA-Z0-9]+$/.test(hash)) return;

    const player = new URL(`https://player.vimeo.com/video/${match[1]}`);
    if (hash) player.searchParams.set("h", hash);
    return player.href;
}
