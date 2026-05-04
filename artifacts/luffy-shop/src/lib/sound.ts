const LOGIN_SOUND_URL = "https://file.garden/aahuG_hIDGRlXD24/In%20This%20Darkness.mp3";

let audio: HTMLAudioElement | null = null;

export function playLoginSound() {
  try {
    if (!audio) {
      audio = new Audio(LOGIN_SOUND_URL);
      audio.volume = 0.6;
    }
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay may be blocked — ignore silently
    });
  } catch {
    // Ignore any audio errors
  }
}
