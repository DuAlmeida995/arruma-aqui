# App Android (Capacitor)

O Arruma Aqui é distribuído como **app Android** (`.apk`). O app é o mesmo frontend React empacotado com o [Capacitor 6](https://capacitorjs.com) numa webview nativa; ele conversa com a API publicada no Render.

Pré-requisitos (já presentes no Mac do Enrico): Node 20+, **JDK 17** e o **Android SDK** (plataforma 35). Não precisa de Android Studio.

## Gerar o APK para distribuir

A API precisa estar publicada (ver `docs/DEPLOY.md`). Dentro de `frontend/`:

```bash
VITE_API_URL=https://<seu-servico>.onrender.com/api npm run app:apk
```

O script recusa endereços sem `https` ou que não terminem em `/api`. O arquivo sai em:

`frontend/android/app/build/outputs/apk/debug/app-debug.apk` (~4 MB)

## Instalar no celular

1. Mande o `.apk` para o celular (WhatsApp, Drive, cabo USB…).
2. Abra o arquivo. O Android vai pedir para **permitir instalar apps desta fonte** — permita só para esse app.
3. Abra **Arruma Aqui** e entre com `cliente@exemplo.com` / `demo1234`.

> É um APK de *debug* (assinado com a chave de desenvolvimento): serve para a disciplina e o piloto. Para publicar na Play Store seria preciso gerar um *release* assinado e pagar a taxa de desenvolvedor.

> O Render gratuito "dorme" após 15 min sem uso: a primeira tela pode levar ~50 s para carregar. Abra o app um minuto antes de apresentar.

## Testar no emulador contra o backend local

Com o backend rodando no computador (`npm start --prefix backend`, porta 4000):

```bash
npm run app:apk:local
```

Esse modo aponta o app para `http://10.0.2.2:4000/api` (o "localhost" do computador visto de dentro do emulador) e libera `http` **só nesse build**. Instale no emulador:

```bash
~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Não distribua o APK gerado por `app:apk:local`: ele não funciona fora do emulador.

## Detalhes técnicos

- Configuração em `frontend/capacitor.config.ts` (id `br.com.arrumaaqui.app`).
- A API aceita as origens do app (`https://localhost` no Android, `capacitor://localhost` no iOS) — ver CORS em `backend/app.js`.
- `targetSdkVersion` 34 (compila com o SDK 35): no alvo 35 o Android 15 força a webview a ocupar a área da barra de status.
- iOS: não incluído por decisão da equipe; pode ser adicionado depois com `npx cap add ios`.
