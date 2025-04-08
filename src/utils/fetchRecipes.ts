const BASE_URL = "https://piattorecipes.com/wp-json/wp/v2";

export async function fetchRecipes() {
  const res = await fetch(`${BASE_URL}/posts?_embed&per_page=100&categories=2`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return await res.json();
}
