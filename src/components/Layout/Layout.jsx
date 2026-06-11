import styles from './Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
