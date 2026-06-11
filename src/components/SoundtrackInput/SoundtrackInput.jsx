import styles from './SoundtrackInput.module.css';

const SoundtrackInput = ({ soundtrack, setSoundtrack }) => {
  return (
    <div className={styles.container}>
      <label htmlFor="soundtrack" className={styles.label}>
        <span role="img" aria-label="headphones">🎧</span> 오늘의 사운드트랙
      </label>
      <input
        id="soundtrack"
        type="text"
        className={styles.input}
        placeholder="오늘 들었던 좋았던 음악 제목이나 링크"
        value={soundtrack}
        onChange={(e) => setSoundtrack(e.target.value)}
      />
    </div>
  );
};

export default SoundtrackInput;
