import styles from './MoodSelector.module.css';

const MOODS = [
  { id: 'great', label: '최고예요', color: 'var(--color-mood-great)' },
  { id: 'good', label: '좋아요', color: 'var(--color-mood-good)' },
  { id: 'okay', label: '그저 그래요', color: 'var(--color-mood-okay)' },
  { id: 'bad', label: '별로예요', color: 'var(--color-mood-bad)' },
  { id: 'awful', label: '최악이에요', color: 'var(--color-mood-awful)' },
];

const MoodSelector = ({ selectedMood, onSelect }) => {
  return (
    <div className={styles.container}>
      <p className={styles.title}>오늘 하루, 전반적인 기분은 어땠나요?</p>
      <div className={styles.dotsWrapper}>
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            className={`${styles.dotButton} ${selectedMood === mood.id ? styles.selected : ''}`}
            style={{ '--dot-color': mood.color }}
            onClick={() => onSelect(mood.id)}
            aria-label={mood.label}
            title={mood.label}
          />
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
