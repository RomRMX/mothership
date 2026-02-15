
export function extractYoutubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function getThumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
}

export function getWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export async function fetchYoutubeMetadata(url: string) {
  try {
    // noembed is a reliable, CORS-friendly way to get YouTube metadata without an API key
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return {
      title: data.title || "Untitled Video",
      author: data.author_name || ""
    };
  } catch (error) {
    console.error("Failed to fetch oEmbed metadata", error);
    return null;
  }
}
