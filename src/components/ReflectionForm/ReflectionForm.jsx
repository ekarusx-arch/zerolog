import { useState, useRef } from 'react';
import styles from './ReflectionForm.module.css';
import MoodSelector from '../MoodSelector/MoodSelector';
import SoundtrackInput from '../SoundtrackInput/SoundtrackInput';
import { createZeroLogEntry } from '../../lib/zeroSlateApi';

const ReflectionForm = ({ accessToken, onAddLog, user, overrideDate }) => {
  const [mood, setMood] = useState(null);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [soundtrack, setSoundtrack] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordingField, setRecordingField] = useState(null); // 'q1', 'q2', or 'q3'
  const recognitionRef = useRef(null);

  // Web Speech API Setup
  const toggleRecording = (field) => {
    if (recordingField === field) {
      recognitionRef.current?.stop();
      setRecordingField(null);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("현재 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.");
      return;
    }

    if (recordingField) {
      recognitionRef.current?.stop();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        if (field === 'q1') setQ1(prev => prev + (prev ? ' ' : '') + finalTranscript);
        if (field === 'q2') setQ2(prev => prev + (prev ? ' ' : '') + finalTranscript);
        if (field === 'q3') setQ3(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setRecordingField(null);
    };

    recognition.onend = () => {
      setRecordingField(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecordingField(field);
  };

  const insertTimeTag = (setField) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeTag = `[${hours}:${minutes}] `;
    
    setField(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '') + timeTag);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood) {
      alert("오늘의 기분을 선택해주세요.");
      return;
    }
    if (!q1.trim() || !q2.trim() || !q3.trim()) {
      alert("모든 질문에 짧게라도 답해주세요.");
      return;
    }
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate slight delay for disintegration animation
    setTimeout(async () => {
      const newLogData = {
        user_id: user.id,
        date: overrideDate ? new Date(overrideDate).toISOString() : new Date().toISOString(),
        mood,
        q1,
        q2,
        q3,
        soundtrack: soundtrack || null
      };

      try {
        const data = await createZeroLogEntry(accessToken, newLogData);
        if (data) onAddLog(data);
      } catch (error) {
        console.error("Error inserting log:", error);
        alert("기록을 저장하는 중 오류가 발생했습니다.");
      }
      
      // Reset form
      setMood(null);
      setQ1('');
      setQ2('');
      setQ3('');
      setSoundtrack('');
      setIsSubmitting(false);
    }, 1400);
  };

  return (
    <div className={`${styles.container} ${isSubmitting ? styles.submitting : ''}`}>
      <form onSubmit={handleSubmit} className={styles.form}>
        
        <MoodSelector selectedMood={mood} onSelect={setMood} />

        <SoundtrackInput soundtrack={soundtrack} setSoundtrack={setSoundtrack} />

        <div className={styles.questionBlock}>
          <div className={styles.labelHeader}>
            <label htmlFor="q1" className={styles.label}>오늘 가장 감사했던 일은?</label>
            <div className={styles.actionButtons}>
              <button type="button" className={styles.timeButton} onClick={() => insertTimeTag(setQ1)} title="현재 시간 삽입하기">🕒</button>
              <button type="button" className={`${styles.micButton} ${recordingField === 'q1' ? styles.recording : ''}`} onClick={() => toggleRecording('q1')} title="음성으로 입력하기">🎤</button>
            </div>
          </div>
          <textarea
            id="q1"
            className={`${styles.textarea} ${isSubmitting ? styles.disintegrate : ''}`}
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            placeholder="마이크 버튼을 누르고 말하거나 직접 입력하세요."
            rows={2}
          />
        </div>

        <div className={styles.questionBlock}>
          <div className={styles.labelHeader}>
            <label htmlFor="q2" className={styles.label}>오늘 아쉬웠거나 배운 점은?</label>
            <div className={styles.actionButtons}>
              <button type="button" className={styles.timeButton} onClick={() => insertTimeTag(setQ2)} title="현재 시간 삽입하기">🕒</button>
              <button type="button" className={`${styles.micButton} ${recordingField === 'q2' ? styles.recording : ''}`} onClick={() => toggleRecording('q2')} title="음성으로 입력하기">🎤</button>
            </div>
          </div>
          <textarea
            id="q2"
            className={`${styles.textarea} ${isSubmitting ? styles.disintegrate : ''}`}
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            placeholder="실수에서 배운 점을 편하게 털어놓으세요."
            rows={2}
          />
        </div>

        <div className={styles.questionBlock}>
          <div className={styles.labelHeader}>
            <label htmlFor="q3" className={styles.label}>내일을 위해 비워내야 할 생각은?</label>
            <div className={styles.actionButtons}>
              <button type="button" className={styles.timeButton} onClick={() => insertTimeTag(setQ3)} title="현재 시간 삽입하기">🕒</button>
              <button type="button" className={`${styles.micButton} ${recordingField === 'q3' ? styles.recording : ''}`} onClick={() => toggleRecording('q3')} title="음성으로 입력하기">🎤</button>
            </div>
          </div>
          <textarea
            id="q3"
            className={`${styles.textarea} ${isSubmitting ? styles.disintegrate : ''}`}
            value={q3}
            onChange={(e) => setQ3(e.target.value)}
            placeholder="스트레스, 걱정 등 내일로 가져가지 않을 감정들을 비워내세요."
            rows={2}
          />
        </div>

        <button type="submit" className={`${styles.submitButton} ${isSubmitting ? styles.disintegrate : ''}`} disabled={isSubmitting || recordingField !== null}>
          {isSubmitting ? '훌훌 털어버리는 중...' : '기록하고 하루 비우기'}
        </button>
      </form>
    </div>
  );
};

export default ReflectionForm;
