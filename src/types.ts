/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Version {
  name: string;
  tone: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  roles: string[]; // instruments / duties (e.g. 'Teclado', 'Voz')
  birthdate: string; // e.g. "DD/MM"
  phone: string;
  role: 'membro' | 'cantor' | 'Líder';
  isAdmin: boolean;
  createdAt?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: string; // e.g., 'Louvor', 'Adoração', 'Celebração', 'Clamor', 'Alegria'
  tone: string;
  bpm?: number;
  lyricsUrl?: string;
  chordsUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  observations?: string;
  versions?: Version[];
}

export interface ScaleParticipant {
  userId: string;
  name: string;
  avatarUrl: string;
  role: string; // e.g. 'Ministro', 'Violão', 'Baixo', 'Teclado', 'Bateria', 'Guitarra', 'Backing Vocal'
  status: 'confirmed' | 'pending' | 'declined';
  shift: '1' | '2' | 'both'; // '1' = 1º Horário, '2' = 2º Horário, 'both' = Ambos os Horários
}

export interface Scale {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:00 / 18:00"
  songIds: string[];
  participants: ScaleParticipant[];
  status: 'draft' | 'published';
  scaleType: 'domingo' | 'terca' | 'ebd' | 'sabado' | 'outro';
  songLeaders?: Record<string, string>; // songId -> user ID or name of leader
  songNotes?: Record<string, string>;   // songId -> custom note
  songSlot?: Record<string, string>;    // songId -> 'celebração' | 'oferta' | 'adoração'
  playlistUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string; // ISO string
}

export interface Devotional {
  title: string;
  passage: string;
  text: string;
  lastUpdated: string;
  helpText?: string;
}
