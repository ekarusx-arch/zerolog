import React, { useState, useEffect } from 'react';
import styles from './RetrospectiveTopics.module.css';

const TOPICS = [
  "오늘 하루 중 가장 나를 웃게 한 순간은?",
  "오늘 겪은 일 중 내일은 다르게 대처하고 싶은 것이 있다면?",
  "지금 내 머릿속을 가장 복잡하게 하는 생각은?",
  "오늘 하루 수고한 나 자신에게 해주고 싶은 한마디는?",
  "오늘 새롭게 배운 점이나 깨달은 것이 있다면?",
  "최근에 감사함을 느꼈던 작은 일상은?",
  "내일 하루를 시작할 때 가장 먼저 하고 싶은 일은?",
  "오늘 하루, 나의 감정 날씨는 어땠나요?"
];

export default function RetrospectiveTopics() {
  const [randomTopics, setRandomTopics] = useState([]);

  useEffect(() => {
    // Pick 3 random topics
    const shuffled = [...TOPICS].sort(() => 0.5 - Math.random());
    setRandomTopics(shuffled.slice(0, 3));
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>💡 오늘의 추천 회고 주제</h3>
      <p className={styles.subtitle}>어떤 이야기를 꺼내야 할지 막막하다면 참고해보세요!</p>
      <div className={styles.topicList}>
        {randomTopics.map((topic, idx) => (
          <div key={idx} className={styles.topicChip}>
            💬 {topic}
          </div>
        ))}
      </div>
    </div>
  );
}
