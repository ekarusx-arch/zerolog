import styles from './SoundtrackPlayer.module.css';

const getEmbedUrl = (url) => {
  try {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    }

    // Spotify
    const spMatch = url.match(/spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
    if (spMatch && spMatch[1] && spMatch[2]) {
      return { type: 'spotify', src: `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}?utm_source=generator` };
    }
  } catch (err) {
    // In case url is not a string or matching fails
  }

  return null;
};

const SoundtrackPlayer = ({ soundtrack }) => {
  if (!soundtrack) return null;

  const embed = getEmbedUrl(soundtrack);

  if (embed) {
    if (embed.type === 'youtube') {
      return (
        <div className={styles.playerContainer}>
          <iframe
            className={styles.iframe}
            src={embed.src}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    } else if (embed.type === 'spotify') {
      return (
        <div className={styles.playerContainer}>
          <iframe
            className={styles.iframeSpotify}
            src={embed.src}
            title="Spotify player"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        </div>
      );
    }
  }

  // Fallback text rendering
  return (
    <div className={styles.soundtrackBlock}>
      <span role="img" aria-label="headphones">🎧</span> <strong>사운드트랙:</strong> {soundtrack}
    </div>
  );
};

export default SoundtrackPlayer;
