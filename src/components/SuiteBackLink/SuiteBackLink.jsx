import { ArrowLeft } from 'lucide-react';
import styles from './SuiteBackLink.module.css';

export default function SuiteBackLink({ href }) {
  return (
    <a href={href} className={styles.link} aria-label="ZeroSlate로 돌아가기">
      <ArrowLeft size={17} aria-hidden="true" />
      <span>ZeroSlate</span>
    </a>
  );
}
