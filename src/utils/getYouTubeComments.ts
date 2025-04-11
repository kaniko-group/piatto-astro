function decodeHtmlEntities(text: string) {
  return text
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&deg;/g, '°')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
}

// ⭐ Basic rule-based sentiment → star rating
function assignStarRating(text: string): number {
  const lower = text.toLowerCase();

  // ❌ Detect negative or complaint language
  if (/bland|gross|not good|bad|horrible|weird|problem|dry|too salty|didn.?t work|didn.?t like/.test(lower)) {
    return 2; // or even 1 if you want
  }

  if (/meh|okay|not bad|just ok/.test(lower)) {
    return 3;
  }

  // ✅ Everything else gets a 5
  return 5;
}



const API_KEY = import.meta.env.YOUTUBE_API_KEY;

export async function getYouTubeComments(videoId: string, maxResults = 100) {
  if (!API_KEY || !videoId) return [];

  const url = `https://www.googleapis.com/youtube/v3/commentThreads?key=${API_KEY}&videoId=${videoId}&part=snippet&maxResults=${maxResults}&order=relevance`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("❌ Failed to fetch YouTube comments", res.statusText);
      return [];
    }

    const data = await res.json();

    return data.items.map((item: any) => {
      const snippet = item.snippet.topLevelComment.snippet;
      const text = decodeHtmlEntities(snippet.textDisplay);
      const stars = assignStarRating(text);

      return {
        text,
        author: snippet.authorDisplayName || "YouTube viewer",
        avatar: snippet.authorProfileImageUrl,
        channelUrl: snippet.authorChannelUrl,
        stars,
        publishedAt: snippet.publishedAt,
      };
    });
  } catch (err) {
    console.error("❌ Error fetching YouTube comments", err);
    return [];
  }
}
