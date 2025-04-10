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

const BASE_URL = "https://piattorecipes.com/wp-json/wp/v2";

export async function fetchRecipes() {
  console.log("Fetching recipes...");

  try {
    const res = await fetch(`${BASE_URL}/posts?_embed&per_page=100&categories=2`);
    if (!res.ok) {
      throw new Error("Failed to fetch posts");
    }

    const posts = await res.json();
    console.log("Fetched posts:", posts);

    return posts.map(post => {
      try {
        const decodedTitle = decodeHtmlEntities(post.title.rendered);
        const decodedExcerpt = decodeHtmlEntities(post.excerpt.rendered);
        let decodedContent = decodeHtmlEntities(post.content.rendered);

        // ✅ Extract YouTube video ID if present
        const youtubeMatch = decodedContent.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
        const youtubeVideoId = youtubeMatch ? youtubeMatch[1] : null;

        // ✅ Fix embedded YouTube links
        if (decodedContent.includes("wp-block-embed__wrapper")) {
          console.log("✔ Embed found in post:", post.slug);

          decodedContent = decodedContent.replace(
            /<div class="wp-block-embed__wrapper">\s*(https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<]+)\s*<\/div>/g,
            (_, url) => {
              const videoId = url.includes("v=")
                ? url.split("v=")[1].split("&")[0]
                : url.split("/").pop();
              const iframeSrc = `https://www.youtube.com/embed/${videoId}`;
              return `<div class="video-wrapper"><iframe src="${iframeSrc}" frameborder="0" allowfullscreen class="w-full aspect-video rounded-lg my-6"></iframe></div>`;
            }
          );
        }

        // ✅ Clean lazyloaded iframes and images
        decodedContent = decodedContent
          .replace(
            /<iframe([^>]+)data-src="([^"]+)"([^>]*)src="[^"]+"([^>]*)>/g,
            '<iframe$1src="$2"$3$4>'
          )
          .replace(/\s+src="data:image\/gif[^"]*"/g, '')
          .replace(/\s+data-src=/g, ' src=')
          .replace(/\s+data-srcset=/g, ' srcset=')
          .replace(/<img(?![^>]*loading=)([^>]+)>/g, '<img loading="lazy"$1>');

        const featuredImage =
          post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;

        return {
          ...post,
          title: { ...post.title, rendered: decodedTitle },
          excerpt: { ...post.excerpt, rendered: decodedExcerpt },
          content: { ...post.content, rendered: decodedContent },
          featuredImage,
          youtubeVideoId, // ✅ Add this to each post
        };
      } catch (err) {
        console.error("🔥 Error transforming post:", post.slug, err);
        return post;
      }
    });
  } catch (error) {
    console.error("Error during fetch operation:", error);
    return [];
  }
}
