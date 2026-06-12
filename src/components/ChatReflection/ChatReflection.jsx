import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatReflection.module.css';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { supabase } from '../../lib/supabaseClient';

const SYSTEM_INSTRUCTION = `
당신은 다정하고 공감 능력이 뛰어난 회고 파트너 '제로(Zero)'입니다.
사용자가 하루를 돌아보고 감정을 정리하여 마음을 비워낼 수 있도록 돕는 것이 목적입니다.
절대로 한 번에 여러 질문을 던지지 마세요. 한 번에 딱 한 가지 질문만 부드럽게 던지세요.
대답은 1~2문장으로 짧고 다정하게 해주세요.
총 3번의 대화(사용자의 대답 횟수 기준)가 오가면, "오늘 하루도 정말 고생 많으셨어요. 이제 기록을 갈무리할게요." 라고 말하며 자연스럽게 대화를 종료하세요.
처음 시작할 때는 "오늘 하루 어떠셨나요? 가장 기억에 남는 일이 있다면 편하게 말씀해 주세요." 라고 시작하세요.
`;

const SUMMARY_PROMPT = `
위 대화 내용을 바탕으로 다음 JSON 스키마에 맞게 요약해주세요.
{
  "mood": "great", // great, good, okay, bad, awful 중 하나만 선택
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
  const maxTurns = 3;
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Re-focus the input automatically when the AI finishes typing
  useEffect(() => {
    if (!isTyping && !isFinished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping, isFinished]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setApiKeyError(true);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      safetySettings
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
      if (botResponse.includes("갈무리") || botResponse.includes("기록을 저장") || botResponse.includes("종료") || messages.filter(m => m.role === 'user').length >= maxTurns - 1) {
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
    setMessages(prev => [...prev, { role: 'model', text: "대화를 바탕으로 오늘 하루의 회고록을 정리하고 있습니다... ✍️" }]);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ];

      const summaryModel = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
        safetySettings
      });

      const historyText = messages.map(m => `${m.role === 'model' ? 'Zero' : 'User'}: ${m.text}`).join('\n');
      const prompt = `${SUMMARY_PROMPT}\n\n[대화 내역]\n${historyText}`;

      const result = await summaryModel.generateContent(prompt);
      const responseText = result.response.text();
      const summaryData = JSON.parse(responseText);

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
        setMessages(prev => [...prev, { role: 'model', text: "회고 기록 저장에 실패했습니다. 다시 시도해주세요." }]);
      } else if (data) {
        setMessages(prev => [...prev, { role: 'model', text: "오늘의 회고가 깔끔하게 갈무리되었습니다! 우측 상단 탭에서 확인해보세요. ✨" }]);
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
        <div className={styles.turnIndicator}>
          대화 진행도: {Math.min(messages.filter(m => m.role === 'user').length, maxTurns)} / {maxTurns}
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
            ref={inputRef}
            type="text"
            className={styles.input}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="오늘 하루에 대해 이야기해주세요..."
            disabled={isTyping || isFinished}
            autoFocus
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
