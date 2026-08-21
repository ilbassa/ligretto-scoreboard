# Ligretto Scoreboard

Web app mobile-first per gestire i punteggi di una partita a Ligretto. I dati della partita restano nel browser tramite `localStorage`.

## Avvio e verifica

```bash
npm install
npm run dev
```

```bash
npm run test
npm run build
```

## Funzioni

- Configurazione da 2 a 12 giocatori con i 12 dorsi reali, distinti per scatola, simbolo e colore.
- Calcolo automatico `carte positive - (carte nel pozzetto × 2)`.
- Vincitore unico per mano e salvataggio individuale correggibile.
- Totali progressivi e storico completo in una modal accessibile.
- Persistenza locale, layout responsive e supporto PWA/offline.
- Sincronizzazione opzionale in tempo reale tra dispositivi tramite WebRTC DataChannel, con ingresso via QR Code o codice manuale.
- Build dedicata a GitHub Pages con `npm run build:pages`.

## Stack

Vue 3, TypeScript, Pinia, Vue Router, Vite, Vitest, PeerJS, html5-qrcode, qrcode, Lucide e vite-plugin-pwa, seguendo struttura e convenzioni di `gym-tracker`.

## Sincronizzazione P2P

Il dispositivo Host usa PeerJS Cloud soltanto per il signaling iniziale; lo stato della partita passa direttamente tra i browser e viene salvato nel `localStorage` di ciascun dispositivo. Non è richiesto alcun database remoto. Lo scanner della fotocamera è disponibile su HTTPS o localhost.
