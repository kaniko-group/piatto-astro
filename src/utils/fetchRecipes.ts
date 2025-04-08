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
        // ✔ Transform lazy YouTube embed wrappers into real iframes
        if (post.content?.rendered?.includes("wp-block-embed__wrapper")) {
          console.log("✔ Embed found in post:", post.slug);

          post.content.rendered = post.content.rendered.replace(
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

        // ✅ Clean lazyloaded iframes and images in post body
        post.content.rendered = post.content.rendered
          // Fix lazyloaded YouTube iframes using data-src
          .replace(
            /<iframe([^>]+)data-src="([^"]+)"([^>]*)src="[^"]+"([^>]*)>/g,
            '<iframe$1src="$2"$3$4>'
          )
          // Fix lazyloaded <img> tags using data-src + base64 placeholder
          .replace(/\s+src="data:image\/gif[^"]*"/g, '')       // remove placeholder src
          .replace(/\s+data-src=/g, ' src=')                   // data-src → src
          .replace(/\s+data-srcset=/g, ' srcset=')             // data-srcset → srcset
          .replace(/<img(?![^>]*loading=)([^>]+)>/g, '<img loading="lazy"$1>'); // enforce native lazyload

        // ✅ Extract featured image
        const featuredImage =
          post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;

        return {
          ...post,
          featuredImage,
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
