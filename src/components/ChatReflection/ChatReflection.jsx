import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatReflection.module.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../../lib/supabaseClient';

const SYSTEM_INSTRUCTION = `
당신은 다정하고 공감 능력이 뛰어난 일기 도우미 '제로(Zero)'입니다.
사용자가 하루를 돌아보고 감정을 정리할 수 있도록 돕는 것이 목적입니다.
절대로 한 번에 여러 질문을 던지지 마세요. 한 번에 딱 한 가지 질문만 부드럽게 던지세요.
대답은 1~2문장으로 짧고 다정하게 해주세요.
총 2~3번의 대화(사용자의 대답 횟수 기준)가 오가면, "오늘 하루도 정말 고생 많으셨어요. 이제 기록을 갈무리할게요." 라고 말하며 자연스럽게 대화를 종료하세요.
처음 시작할 때는 "오늘 하루 어떠셨나요? 가장 기억에 남는 일이 있다면 편하게 말씀해 주세요." 라고 시작하세요.
`;

const SUMMARY_PROMPT = `
위 대화 내용을 바탕으로 다음 JSON 형식에 맞게 요약해주세요. JSON 외의 다른 텍스트는 절대 출력하지 마세요.
{
  "mood": "great", // great, good, okay, bad, awful 중 하나로 감정 상태 유추
  "q1": "오늘 가장 감사했던 일 (대화에서 추출하거나 없으면 '특별히 언급되지 않았지만 평온한 하루를 보냈습니다.' 등으로 작성)",
  "q2": "오늘 아쉬웠거나 배운 점 (대화에서 추출)",
  "q3": "내일을 위해 비워내야 할 생각 (대화에서 추출)"
}
`;

const ChatReflection = ({ onAddLog, user }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setApiKeyError(true);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const session = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 256,
      },
    });

    setChatSession(session);
    
    // Initial greeting
    setMessages([{ role: 'model', text: "오늘 하루 어떠셨나요? 가장 기억에 남는 일이 있다면 편하게 말씀해 주세요. ✨" }]);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !chatSession || isTyping || isFinished) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const result = await chatSession.sendMessage(userMessage);
      const botResponse = result.response.text();
      
      setMessages(prev => [...prev, { role: 'model', text: botResponse }]);

      // Check if the bot implies conversation is ending
      if (botResponse.includes("갈무리") || botResponse.includes("기록을 저장") || botResponse.includes("종료") || messages.filter(m => m.role === 'user').length >= 2) {
        setIsFinished(true);
        setTimeout(() => summarizeAndSave(), 1500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "앗, 대화를 처리하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const summarizeAndSave = async () => {
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'model', text: "대화를 바탕으로 오늘 하루를 일기로 정리하고 있습니다... ✍️" }]);
    
    try {
      // Create a specific prompt to summarize
      const result = await chatSession.sendMessage(SUMMARY_PROMPT);
      const responseText = result.response.text();
      
      // Extract JSON using regex in case the model adds extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to find JSON in response: " + responseText);
      }
      
      const summaryData = JSON.parse(jsonMatch[0]);

      const newLogData = {
        user_id: user.id,
        date: new Date().toISOString(),
        mood: summaryData.mood || 'okay',
        q1: summaryData.q1 || '기록 없음',
        q2: summaryData.q2 || '기록 없음',
        q3: summaryData.q3 || '기록 없음',
        soundtrack: null
      };

      const { data, error } = await supabase
        .from('zerolog_entries')
        .insert([newLogData])
        .select()
        .single();

      if (error) {
        console.error("Error saving log:", error);
        setMessages(prev => [...prev, { role: 'model', text: "일기 저장에 실패했습니다. 다시 시도해주세요." }]);
      } else if (data) {
        setMessages(prev => [...prev, { role: 'model', text: "일기 작성이 완료되었습니다! 달력에서 확인해보세요. ✨" }]);
        setTimeout(() => {
          onAddLog(data);
        }, 2000);
      }

    } catch (error) {
      console.error("Summary error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "요약 저장 중 오류가 발생했습니다." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (apiKeyError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h3>API 키가 필요합니다</h3>
          <p>대화형 AI를 사용하려면 <code>.env.local</code> 파일에 <code>VITE_GEMINI_API_KEY</code>를 설정해주세요.</p>
          <p>구글 AI Studio에서 무료로 발급받을 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.aiAvatar}>✨</div>
        <div className={styles.headerInfo}>
          <h3>Zero</h3>
          <span>당신의 AI 리스너</span>
        </div>
      </div>

      <div className={styles.chatArea}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.isUser : styles.isModel}`}>
            {msg.role === 'model' && <div className={styles.messageAvatar}>✨</div>}
            <div className={styles.messageBubble}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.messageWrapper} ${styles.isModel}`}>
            <div className={styles.messageAvatar}>✨</div>
            <div className={styles.typingIndicator}>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <form onSubmit={handleSendMessage} className={styles.form}>
          <input
            type="text"
            className={styles.input}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="오늘 하루에 대해 이야기해주세요..."
            disabled={isTyping || isFinished}
          />
          <button type="submit" className={styles.sendButton} disabled={!inputText.trim() || isTyping || isFinished}>
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatReflection;
