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

const API_KEY = import.meta.env.YOUTUBE_API_KEY;

export async function getYouTubeComments(videoId: string, maxResults = 10) {
  if (!API_KEY || !videoId) return [];

  const url = `https://www.googleapis.com/youtube/v3/commentThreads?key=${API_KEY}&videoId=${videoId}&part=snippet&maxResults=${maxResults}&order=relevance`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("❌ Failed to fetch YouTube comments", res.statusText);
      return [];
    }

    const data = await res.json();

    console.log("✅ Fetched comments:", data.items);

    return data.items.map((item: any) => {
      // Decode the comment text to handle emoji properly
      const comment = decodeHtmlEntities(item.snippet.topLevelComment.snippet.textDisplay);
      return comment;
    });
  } catch (err) {
    console.error("❌ Error fetching YouTube comments", err);
    return [];
  }
}
