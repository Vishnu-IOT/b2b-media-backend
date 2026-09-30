const extractYoutubeId = (url) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m)\./, '');
    let id = null;

    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{11})/);
        if (m) id = m[2];
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch (e) {
    return null;
  }
};

// Returns the canonical watch URL, or null when the URL is not a valid YouTube link
const normalizeYoutubeUrl = (url) => {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
};

module.exports = { extractYoutubeId, normalizeYoutubeUrl };
