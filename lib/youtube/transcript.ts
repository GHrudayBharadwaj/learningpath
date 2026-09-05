export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  hasTranscript: boolean;
  transcriptText: string;
  statusMessage: string;
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("?")[0];
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchYouTubeInfo(url: string): Promise<YouTubeVideoInfo> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL. Please provide a standard watch link or youtu.be short link.");
  }

  let title = "YouTube Video";
  let channel = "YouTube Creator";

  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      title = oembedData.title || title;
      channel = oembedData.author_name || channel;
    }
  } catch {
    // Continue
  }

  let hasTranscript = false;
  let transcriptText = "";
  let statusMessage = "Captions/Transcript could not be extracted automatically. Video metadata and title retrieved.";

  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIStudyPlanner/1.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (watchRes.ok) {
      const pageHtml = await watchRes.text();
      const captionMatch = pageHtml.match(/"captionTracks":\s*(\[.*?\])/);
      if (captionMatch) {
        const captionTracks = JSON.parse(captionMatch[1]);
        const enTrack = captionTracks.find((t: any) => t.languageCode === "en") || captionTracks[0];
        if (enTrack?.baseUrl) {
          const transcriptRes = await fetch(enTrack.baseUrl);
          if (transcriptRes.ok) {
            const xml = await transcriptRes.text();
            const textMatches = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || [];
            transcriptText = textMatches
              .map(t => t.replace(/<[^>]+>/g, "").replace(/&amp;#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim())
              .filter(Boolean)
              .join(" ");
            
            if (transcriptText.length > 50) {
              hasTranscript = true;
              statusMessage = "Full English transcript extracted successfully.";
            }
          }
        }
      }
    }
  } catch {
    // Transcript unavailable
  }

  if (!hasTranscript) {
    statusMessage = "Note: Video transcript is disabled or not publicly accessible for this video. The AI notes engine will use the title and video overview.";
  }

  return {
    videoId,
    title,
    channel,
    description: `Video by ${channel} regarding ${title}`,
    hasTranscript,
    transcriptText: transcriptText || `YouTube resource: ${title} by ${channel}.`,
    statusMessage,
  };
}
