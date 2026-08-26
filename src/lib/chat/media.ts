export async function openCallMedia(kind: "video" | "audio"): Promise<MediaStream> {
  const constraints: MediaStreamConstraints =
    kind === "video"
      ? {
          audio: { echoCancellation: true, noiseSuppression: true },
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 1280 },
            aspectRatio: { ideal: 0.75 },
          },
        }
      : {
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch {
    if (kind === "video") {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: "user" },
        });
      } catch {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
    }
    throw new Error("تعذر فتح الميكروفون");
  }
}

export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
