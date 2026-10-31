/**
 * Сводит клавиатуру, мышь и тач к одному действию — «взмах».
 * Игра подписывается на одно событие и не знает об устройствах ввода.
 */
export class Input {
  constructor(
    private readonly target: HTMLElement,
    private readonly onAction: () => void,
  ) {
    window.addEventListener('keydown', this.handleKey);
    this.target.addEventListener('pointerdown', this.handlePointer);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKey);
    this.target.removeEventListener('pointerdown', this.handlePointer);
  }

  private handleKey = (event: KeyboardEvent): void => {
    const isActionKey = event.code === 'Space' || event.code === 'ArrowUp';
    if (!isActionKey) return;

    event.preventDefault(); // пробел не должен скроллить страницу
    if (!event.repeat) this.onAction();
  };

  private handlePointer = (event: PointerEvent): void => {
    event.preventDefault();
    this.onAction();
  };
}
