import React, { useState } from 'react';
import styles from './AuthScreen.module.css';
import { supabase } from '../../lib/supabaseClient';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setErrorMsg(error.message);
      else alert('회원가입이 완료되었습니다. 이메일을 확인하거나 로그인해주세요.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <h1 className={styles.title}>ZeroLog</h1>
        <p className={styles.subtitle}>생각을 비우고, 오늘을 기록하세요.</p>
        
        {errorMsg && <div className={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            type="email" 
            placeholder="이메일 (ZeroSlate 계정과 동일)" 
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" className={styles.loginButton} disabled={isLoading}>
            {isLoading ? '요청 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className={styles.modeToggle}>
          {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
