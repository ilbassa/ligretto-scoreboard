import type { DeckColor, DeckDefinition } from '@/models'

const slug = (value: string) => value.toLocaleLowerCase('it-IT')

function deck(box: DeckDefinition['box'], symbol: DeckDefinition['symbol'], deckColor: DeckColor): DeckDefinition {
  return { id: `${slug(box)}-${slug(deckColor)}`, box, symbol, deckColor }
}

export const decks: DeckDefinition[] = [
  deck('Rossa', 'Fulmine', 'Rosso'),
  deck('Rossa', 'Fulmine', 'Azzurro'),
  deck('Rossa', 'Fulmine', 'Rosa'),
  deck('Rossa', 'Fulmine', 'Nero'),
  deck('Blu', 'Palline', 'Blu'),
  deck('Blu', 'Palline', 'Viola'),
  deck('Blu', 'Palline', 'Arancio'),
  deck('Blu', 'Palline', 'Verde'),
  deck('Verde', 'Fulmine', 'Viola'),
  deck('Verde', 'Fulmine', 'Fucsia'),
  deck('Verde', 'Fulmine', 'Verde'),
  deck('Verde', 'Fulmine', 'Marrone')
]

const accents: Record<DeckColor, string> = {
  Marrone: '#8a5b3d',
  Viola: '#7e57c2',
  Verde: '#299660',
  Fucsia: '#d83b91',
  Blu: '#3372c5',
  Arancio: '#ee7a24',
  Rosso: '#d64545',
  Azzurro: '#39a7df',
  Rosa: '#eb73a4',
  Nero: '#292724'
}

export function getDeck(deckId: string): DeckDefinition | undefined {
  return decks.find((deck) => deck.id === deckId)
}

export function deckLabel(deck: DeckDefinition): string {
  return `Scatola ${deck.box} · ${deck.symbol} ${deck.deckColor}`
}

export function scoreboardDeckLabel(deck: DeckDefinition): string {
  return `${deck.symbol} ${deck.deckColor}`
}

export function deckAccent(deck: DeckDefinition): string {
  return accents[deck.deckColor]
}
