import { CONFIG } from './config';

/** Рекорд в localStorage. Ошибки хранилища (приватный режим и т.п.) не ломают игру. */
export class ScoreStorage {
  load(): number {
    try {
      return Number(localStorage.getItem(CONFIG.storageKey)) || 0;
    } catch {
      return 0;
    }
  }

  save(score: number): void {
    try {
      localStorage.setItem(CONFIG.storageKey, String(score));
    } catch {
      /* игнорируем */
    }
  }
}
