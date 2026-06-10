/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song, Scale, Message, Devotional } from '../types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  roles: string[];
  birthdate: string; // MM-DD or DD/MM
  isAdmin: boolean;
  phone: string;
  role: 'membro' | 'cantor' | 'Líder';
}

export const INITIAL_USERS: UserProfile[] = [];

export const INITIAL_SONGS: Song[] = [
  {
    id: 's_1',
    title: 'A Casa É Sua',
    artist: 'Casa Worship',
    category: 'Adoração',
    tone: 'G',
    bpm: 72,
    lyricsUrl: 'https://www.letras.mus.br/casa-worship/a-casa-e-sua/',
    chordsUrl: 'https://www.cifraclub.com.br/casa-worship/a-casa-e-sua/',
    audioUrl: 'https://open.spotify.com/track/7p73aAnrDbyN1hW6I3I9it',
    videoUrl: 'https://www.youtube.com/watch?v=s5Z-KjL_bF0',
    observations: 'Espaço aberto para ministração e solo de teclado no meio. Manter levada suave inicial.',
    versions: [
      { name: 'Tom original', tone: 'G' },
      { name: 'Versão Voz Feminina', tone: 'D' }
    ]
  },
  {
    id: 's_2',
    title: 'Bondade de Deus',
    artist: 'Isaías Saad',
    category: 'Adoração',
    tone: 'Ab',
    bpm: 68,
    lyricsUrl: 'https://www.letras.mus.br/isaias-saad/bondade-de-god/',
    chordsUrl: 'https://www.cifraclub.com.br/isaias-saad/bondade-de-deus/',
    audioUrl: 'https://open.spotify.com/track/1P6u79K88F06XmYvX6I8q2',
    videoUrl: 'https://www.youtube.com/watch?v=FjI5jYAsA2o',
    observations: 'Entrada marcante no violão de cordas de aço. Backings crescem no segundo refrão.',
    versions: [
      { name: 'Tom original masculino', tone: 'Ab' },
      { name: 'Feminino Facilitado', tone: 'D' }
    ]
  },
  {
    id: 's_3',
    title: 'Reis dos Reis (King of Kings)',
    artist: 'Hillsong Worship',
    category: 'Celebração',
    tone: 'D',
    bpm: 68,
    lyricsUrl: 'https://www.letras.mus.br/hillsong-worship/king-of-kings/',
    chordsUrl: 'https://www.cifraclub.com.br/hillsong-worship/king-of-kings/',
    audioUrl: 'https://open.spotify.com/track/4H8pT6eJk7TAnpA5Z1Fv2V',
    videoUrl: 'https://www.youtube.com/watch?v=Of5IcFWiEpg',
    observations: 'Crescendo progressivo a cada estrofe. Bateria entra com bumbo pesando no segundo verso.',
    versions: [
      { name: 'Tom original', tone: 'D' }
    ]
  },
  {
    id: 's_4',
    title: 'Me Atraiu',
    artist: 'Gabriela Rocha',
    category: 'Adoração',
    tone: 'E',
    bpm: 70,
    lyricsUrl: 'https://www.letras.mus.br/gabriela-rocha/me-atraiu/',
    chordsUrl: 'https://www.cifraclub.com.br/gabriela-rocha/me-atraiu/',
    audioUrl: 'https://open.spotify.com/track/0Uny6vW7lUbyh0YmFfTfU8',
    videoUrl: 'https://www.youtube.com/watch?v=68E6A6pU3I4',
    observations: 'Começa apenas com piano suave e voz. No refrão final, toda a banda explode forte.',
    versions: [
      { name: 'Tom original Gabriela', tone: 'E' },
      { name: 'Tom Masculino adaptado', tone: 'A' }
    ]
  },
  {
    id: 's_5',
    title: 'O Escudo',
    artist: 'Voz da Verdade',
    category: 'Clamor',
    tone: 'Am',
    bpm: 75,
    lyricsUrl: 'https://www.letras.mus.br/voz-da-verdade/o-escudo/',
    chordsUrl: 'https://www.cifraclub.com.br/voz-da-verdade/o-escudo/',
    audioUrl: 'https://open.spotify.com/track/6pYVUrAn7sUbyW6u9I8oV3',
    videoUrl: 'https://www.youtube.com/watch?v=gTWhl0IuYQk',
    observations: 'Adicionar metais/strings sintetizados no teclado. Muita dinâmica para sustentar os solos.',
    versions: [
      { name: 'Tom Original Am', tone: 'Am' }
    ]
  },
  {
    id: 's_6',
    title: 'Vem me Buscar',
    artist: 'Jefferson & Suellen',
    category: 'Celebração',
    tone: 'F#m',
    bpm: 125,
    lyricsUrl: 'https://www.letras.mus.br/jefferson-suellen/vem-me-buscar/',
    chordsUrl: 'https://www.cifraclub.com.br/jefferson-suellen/vem-me-buscar/',
    audioUrl: 'https://open.spotify.com/track/2S7TWhY9y8mYxTfW8I8f6',
    videoUrl: 'https://www.youtube.com/watch?v=VzZ1YtOBeuo',
    observations: 'Requer andamento rítmico perfeitamente sincronizado. Baixo executa notas marcantes/cavadas.',
    versions: [
      { name: 'Tom Original', tone: 'F#m' }
    ]
  },
  {
    id: 's_7',
    title: 'A Ele a Glória',
    artist: 'Gabriela Rocha',
    category: 'Clamor',
    tone: 'C',
    bpm: 66,
    lyricsUrl: 'https://www.letras.mus.br/gabriela-rocha/a-ele-a-gloria/',
    chordsUrl: 'https://www.cifraclub.com.br/gabriela-rocha/a-ele-a-gloria/',
    audioUrl: 'https://open.spotify.com/track/2fBYZ8yWwG2e9LofW2Is9d',
    videoUrl: 'https://www.youtube.com/watch?v=sOnf7hVf48g',
    observations: 'A transição para Romanos 11:36 deve ser majestosa. Vocais cuidem para sustentar a harmonia.',
    versions: [
      { name: 'Tom C para Fêmea', tone: 'C' },
      { name: 'Tom G para Homem', tone: 'G' }
    ]
  }
];

export const INITIAL_SCALES: Scale[] = [];

export const INITIAL_MESSAGES: Message[] = [];

export const INITIAL_DEVOTIONAL: Devotional = {
  title: 'Coração de Adorador e Unidade do Corpo',
  passage: 'Efésios 6:7 (ARA) - "Servindo de boa mente como ao Senhor e não como a homens."',
  text: 'Querida equipe de louvor e adoração Belvedere, cantar e tocar no altar do Senhor é um ato solene de profunda gratidão e amor. Deus busca adoradores que o adorem em espírito e em verdade. Quando subimos para ministrar, nosso foco único deve ser Jesus. Toda a preparação musical, a submissão aos arranjos, e o companheirismo mútuo refletem a unidade do Espírito Santo em nosso meio. Que esta semana possamos servir de boa mente, lembrando que nossa maior e melhor audiência é o Próprio Pai celeste.',
  lastUpdated: '2026-06-10T03:00:00Z',
  helpText: 'Os ensaios regulares acontecem aos sábados, às 16h00 no templo Belvedere. Se precisar de substituto, notifique a liderança no mural de recados até a terça-feira anterior.'
};
