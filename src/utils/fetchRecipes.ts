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
        // Check if the post content has a youtube embed wrapper
        if (post.content?.rendered?.includes("wp-block-embed__wrapper")) {
          console.log("✔ Embed found in post:", post.slug);

          // Replace the wp-block-embed__wrapper to embed the actual youtube video
          post.content.rendered = post.content.rendered.replace(
            /<div class="wp-block-embed__wrapper">\s*(https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<]+)\s*<\/div>/g,
            (_, url) => {
              // Extract the YouTube video ID from the URL
              const videoId = url.includes("v=")
                ? url.split("v=")[1].split("&")[0]  // Standard YouTube format
                : url.split("/").pop();  // Shortened URL format
              
              // Generate the proper iframe embed code
              const iframeSrc = `https://www.youtube.com/embed/${videoId}`;
              
              // Return the full iframe embed code for YouTube
              return `<div class="video-wrapper"><iframe src="${iframeSrc}" frameborder="0" allowfullscreen class="w-full aspect-video rounded-lg my-6"></iframe></div>`;
            }
          );
        }
      } catch (err) {
        console.error("🔥 Error transforming embed for post:", post.slug, err);
      }

      return post;
    });
  } catch (error) {
    console.error("Error during fetch operation:", error);
  }
}
