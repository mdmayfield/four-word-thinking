import styles from './styles/CardGrid.module.css';

export const CardGrid = () => {
  return (
    <div className={styles.cardGrid}>
      {[...Array(4)].map((_, index) => (
        <div key={index} className={styles.card} />
      ))}
    </div>
  );
};
