/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song, Scale, Message, Devotional } from '../types';
import { INITIAL_SONGS, INITIAL_SCALES, INITIAL_MESSAGES, INITIAL_USERS, INITIAL_DEVOTIONAL, UserProfile } from './initialData';

const KEYS = {
  SONGS: 'belvedere_songs_v1',
  SCALES: 'belvedere_scales_v1',
  MESSAGES: 'belvedere_messages_v1',
  USERS: 'belvedere_users_v1',
  DEVOTIONAL: 'belvedere_devotional_v1',
  CURRENT_USER_ID: 'belvedere_current_user_id_v1',
};

// Retrieve from localStorage or fallback to initial seed
export function getSavedSongs(): Song[] {
  const data = localStorage.getItem(KEYS.SONGS);
  if (!data) {
    localStorage.setItem(KEYS.SONGS, JSON.stringify(INITIAL_SONGS));
    return INITIAL_SONGS;
  }
  return JSON.parse(data);
}

export function saveSongs(songs: Song[]): void {
  localStorage.setItem(KEYS.SONGS, JSON.stringify(songs));
}

export function getSavedScales(): Scale[] {
  const data = localStorage.getItem(KEYS.SCALES);
  if (!data) {
    localStorage.setItem(KEYS.SCALES, JSON.stringify(INITIAL_SCALES));
    return INITIAL_SCALES;
  }
  return JSON.parse(data);
}

export function saveScales(scales: Scale[]): void {
  localStorage.setItem(KEYS.SCALES, JSON.stringify(scales));
}

export function getSavedMessages(): Message[] {
  const data = localStorage.getItem(KEYS.MESSAGES);
  if (!data) {
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    return INITIAL_MESSAGES;
  }
  return JSON.parse(data);
}

export function saveMessages(messages: Message[]): void {
  localStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
}

export function getSavedUsers(): UserProfile[] {
  const data = localStorage.getItem(KEYS.USERS);
  if (!data) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(data);
}

export function saveUsers(users: UserProfile[]): void {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function getSavedDevotional(): Devotional {
  const data = localStorage.getItem(KEYS.DEVOTIONAL);
  if (!data) {
    localStorage.setItem(KEYS.DEVOTIONAL, JSON.stringify(INITIAL_DEVOTIONAL));
    return INITIAL_DEVOTIONAL;
  }
  return JSON.parse(data);
}

export function saveDevotional(devotional: Devotional): void {
  localStorage.setItem(KEYS.DEVOTIONAL, JSON.stringify(devotional));
}

export function getSavedCurrentUserId(): string | null {
  return localStorage.getItem(KEYS.CURRENT_USER_ID);
}

export function saveCurrentUserId(id: string): void {
  localStorage.setItem(KEYS.CURRENT_USER_ID, id);
}

export function clearCurrentUserId(): void {
  localStorage.removeItem(KEYS.CURRENT_USER_ID);
}
