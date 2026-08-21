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
- Build dedicata a GitHub Pages con `npm run build:pages`.

## Stack

Vue 3, TypeScript, Pinia, Vue Router, Vite, Vitest, Lucide e vite-plugin-pwa, seguendo struttura e convenzioni di `gym-tracker`.
