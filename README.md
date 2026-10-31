# sloppybird

## Структура проекта:

```
src
    sloppybird # сама игра
    telegram   # конфиг бота, все что связано с telegram интеграцией
deploy # Игра собранная в статику для хостинга на Github Pages 
```

## Quickstart

1. Заполнить .env своими данными

.env

```
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_GAME_URL=your_game_url
```

2. Собрать игру и задеплоить

```bash
bun run deploy:game
git push
```

3. Установить зависимости и запустить бота

```bash
bun install 
bun run start:bot
```

## P.S.

Bun в данном случае полностью совместим с Node - все что нужно для запуска на NodeJS - собирать приложения с помощью tsc