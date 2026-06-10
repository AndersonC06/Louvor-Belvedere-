/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { Song, Version, UserProfile } from '../types';
import { 
  Music, Search, Plus, Trash2, ExternalLink, Video, Link, 
  Activity, FileText, ChevronDown, ListMusic, Layers, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RepertoireTabProps {
  currentUser: UserProfile;
  songs: Song[];
  onAddSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onUpdateSong?: (song: Song) => void;
}

export default function RepertoireTab({
  currentUser,
  songs,
  onAddSong,
  onDeleteSong,
  onUpdateSong
}: RepertoireTabProps) {
  // Authorization role check: Leaders and Cantores have permission to add, edit or delete songs
  const isLiderOrCantor = currentUser.role === 'Líder' || currentUser.role === 'cantor' || currentUser.isAdmin;

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Todos');

  // Add Song Form state
  const [showAddSong, setShowAddSong] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCategory, setNewCategory] = useState('Adoração');
  const [newTone, setNewTone] = useState('C');
  const [newBpm, setNewBpm] = useState<number>(70);
  const [newLyrics, setNewLyrics] = useState('');
  const [newChords, setNewChords] = useState('');
  const [newAudio, setNewAudio] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const [newObs, setNewObs] = useState('');

  // Individual alternate versions inside the creator form
  const [vName, setVName] = useState('');
  const [vTone, setVTone] = useState('');
  const [formVersions, setFormVersions] = useState<Version[]>([]);

  // Expanded Songs Details state (id map)
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);

  const availableCategories = ['Todos', 'Louvor', 'Adoração', 'Celebração', 'Clamor', 'Alegria'];

  const handleStartEdit = (song: Song) => {
    setEditingSong(song);
    setNewTitle(song.title);
    setNewArtist(song.artist);
    setNewCategory(song.category);
    setNewTone(song.tone);
    setNewBpm(song.bpm || 70);
    setNewLyrics(song.lyricsUrl || '');
    setNewChords(song.chordsUrl || '');
    setNewAudio(song.audioUrl || '');
    setNewVideo(song.videoUrl || '');
    setNewObs(song.observations || '');
    setFormVersions(song.versions || []);
    setShowAddSong(true);
    // Scroll up smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpand = (songId: string) => {
    if (expandedSongId === songId) {
      setExpandedSongId(null);
    } else {
      setExpandedSongId(songId);
    }
  };

  const handleAddVersion = () => {
    if (!vName || !vTone) return;
    setFormVersions([...formVersions, { name: vName, tone: vTone }]);
    setVName('');
    setVTone('');
  };

  const handleRemoveVersionForm = (idx: number) => {
    setFormVersions(formVersions.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newArtist || !newTone) {
      alert('Preencha pelo menos o Título do Louvor, o Artista e o Tom!');
      return;
    }

    if (editingSong) {
      const updatedSong: Song = {
        id: editingSong.id,
        title: newTitle,
        artist: newArtist,
        category: newCategory,
        tone: newTone,
        bpm: newBpm || undefined,
        lyricsUrl: newLyrics || undefined,
        chordsUrl: newChords || undefined,
        audioUrl: newAudio || undefined,
        videoUrl: newVideo || undefined,
        observations: newObs || undefined,
        versions: formVersions.length > 0 ? formVersions : undefined
      };
      onUpdateSong?.(updatedSong);
      alert('Louvor atualizado com sucesso no Repertório!');
      setEditingSong(null);
    } else {
      const nId = 's_' + (songs.length + 1) + '_' + Math.floor(Math.random() * 90 + 10);
      const nSong: Song = {
        id: nId,
        title: newTitle,
        artist: newArtist,
        category: newCategory,
        tone: newTone,
        bpm: newBpm || undefined,
        lyricsUrl: newLyrics || undefined,
        chordsUrl: newChords || undefined,
        audioUrl: newAudio || undefined,
        videoUrl: newVideo || undefined,
        observations: newObs || undefined,
        versions: formVersions.length > 0 ? formVersions : undefined
      };
      onAddSong(nSong);
      alert('Louvor adicionado ao repertório com sucesso!');
    }

    // Reset Form
    setNewTitle('');
    setNewArtist('');
    setNewCategory('Adoração');
    setNewTone('C');
    setNewBpm(70);
    setNewLyrics('');
    setNewChords('');
    setNewAudio('');
    setNewVideo('');
    setNewObs('');
    setFormVersions([]);
    setShowAddSong(false);
  };

  // Filtration logic
  const filteredSongs = songs.filter(song => {
    const sMatch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   song.tone.toLowerCase().includes(searchQuery.toLowerCase());
    const cMatch = currentCategory === 'Todos' || song.category === currentCategory;
    return sMatch && cMatch;
  });

  return (
    <div id="repertoire-tab-scroller" className="space-y-6 max-w-4xl mx-auto selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      
      {/* Search Header toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, artista ou tom sugerido (ex: G)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {isLiderOrCantor && (
          <button
            onClick={() => {
              if (showAddSong) {
                setEditingSong(null);
                // Clear state
                setNewTitle('');
                setNewArtist('');
                setNewCategory('Adoração');
                setNewTone('C');
                setNewBpm(70);
                setNewLyrics('');
                setNewChords('');
                setNewAudio('');
                setNewVideo('');
                setNewObs('');
                setFormVersions([]);
              }
              setShowAddSong(!showAddSong);
            }}
            className="text-xs font-semibold py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
          >
            {showAddSong ? 'Cancelar Ficha' : 'Adicionar Música'}
          </button>
        )}
      </div>

      {/* Category badg pills */}
      <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCurrentCategory(cat)}
            className={`text-xs px-4 py-1.5 rounded-xl border font-semibold transition cursor-pointer ${
              currentCategory === cat 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-xs'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showAddSong ? (
        /* Create/Add Song panel Card */
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-md"
        >
          <div className="flex items-center gap-2 text-indigo-600 mb-4 border-b border-slate-100 pb-3">
            <Sparkles className="h-5 w-5" />
            <h4 className="font-sans font-bold text-slate-900 text-base">
              {editingSong ? `Editar Ficha de Louvor: ${editingSong.title}` : 'Nova Ficha de Louvor'}
            </h4>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Row 1: Title, Artist, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título da Música</label>
                <input
                  type="text"
                  placeholder="Ex: Hosana"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Artistas / Ministério</label>
                <input
                  type="text"
                  placeholder="Ex: Renascer Praise"
                  required
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Momento Rítmico</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-slate-850"
                >
                  <option value="Adoração">Adoração (Espontâneo)</option>
                  <option value="Celebração">Celebração (Alegre)</option>
                  <option value="Clamor">Clamor / Arrependimento</option>
                  <option value="Louvor">Louvor Comum</option>
                  <option value="Alegria">Alegria / Entrada</option>
                </select>
              </div>
            </div>

            {/* Row 2: Suggested Tom, BPM, Arrangement */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tom Sugerido (Mais usado)</label>
                <input
                  type="text"
                  placeholder="Ex: F#m"
                  required
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Andamento (BPM)</label>
                <input
                  type="number"
                  placeholder="70"
                  value={newBpm}
                  onChange={(e) => setNewBpm(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Observações do Arranjo</label>
                <input
                  type="text"
                  placeholder="Acústico suave, solos de bateria..."
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                />
              </div>
            </div>

            {/* Row 3: Useful Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Link Cifra (Cifra Club, etc)</label>
                <input
                  type="url"
                  placeholder="https://cifraclub.com.br/..."
                  value={newChords}
                  onChange={(e) => setNewChords(e.target.value)}
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Link Letra (Letras.Mus ou similar)</label>
                <input
                  type="url"
                  placeholder="https://letras.mus.br/..."
                  value={newLyrics}
                  onChange={(e) => setNewLyrics(e.target.value)}
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Link Spotify / Deezer Audio</label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/track/..."
                  value={newAudio}
                  onChange={(e) => setNewAudio(e.target.value)}
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Link YouTube Video / Tutorial</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?..."
                  value={newVideo}
                  onChange={(e) => setNewVideo(e.target.value)}
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-slate-800"
                />
              </div>
            </div>

            {/* Sub-versions Form builder */}
            <div className="bg-indigo-50/20 border border-slate-100 p-3.5 rounded-2xl space-y-2">
              <h5 className="text-[10px] font-bold uppercase text-indigo-950 flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                Versões / Transposições de Tons Alternativos
              </h5>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Descrição (ex: Tom Voz Feminina)"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 p-1.5 text-xs rounded-lg placeholder-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tom (ex: D)"
                  value={vTone}
                  onChange={(e) => setVTone(e.target.value)}
                  className="w-[90px] bg-white border border-slate-200 p-1.5 text-xs rounded-lg placeholder-slate-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddVersion}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer transition font-bold"
                >
                  Adicionar
                </button>
              </div>

              {/* Version preview labels */}
              {formVersions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formVersions.map((v, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-white border border-slate-200 py-0.5 px-2 rounded text-[10px] text-slate-700">
                      <span>{v.name} (<strong>{v.tone}</strong>)</span>
                      <button 
                        type="button" 
                        className="text-red-500 font-bold ml-1 hover:text-red-700 cursor-pointer"
                        onClick={() => handleRemoveVersionForm(index)}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSong(null);
                  setShowAddSong(false);
                }}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs rounded-xl cursor-pointer"
              >
                Descartar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                {editingSong ? 'Salvar Alterações' : 'Registrar no Repertório'}
              </button>
            </div>

          </form>
        </motion.div>
      ) : null}

      {/* Grid of repertoire results with expander */}
      <div className="space-y-3">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <Music className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-900">Nenhum louvor catalogado</h4>
            <p className="text-xs text-slate-400 mt-1">Sua busca não retornou correspondências para "{searchQuery}" na categoria "{currentCategory}".</p>
          </div>
        ) : (
          filteredSongs.map((song) => {
            const isExpanded = expandedSongId === song.id;

            return (
              <div
                key={song.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-350 transition-all duration-200"
              >
                {/* Header row click-expand */}
                <div
                  onClick={() => toggleExpand(song.id)}
                  className="p-4 flex items-center justify-between cursor-pointer gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-indigo-50 border border-indigo-200/50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Music className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate max-w-[200px] sm:max-w-xs">{song.title}</h4>
                      <p className="text-[10px] text-slate-500 font-sans tracking-wide leading-tight truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>

                  {/* Badges indicators & collapse */}
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 rounded-lg px-2 py-0.5">
                      {song.category}
                    </span>
                    
                    <span className="h-6 w-9 font-mono font-bold text-xs text-slate-700 bg-slate-100 rounded-md flex items-center justify-center">
                      {song.tone}
                    </span>

                    <ChevronDown className={`h-4.5 w-4.5 text-slate-405 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details inside */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/55 p-4 space-y-4"
                    >
                      {/* Sub row - BPM & details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Metadados block */}
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Orientações de Arranjo</span>
                          {song.observations ? (
                            <p className="text-xs text-slate-600 leading-normal bg-white p-2.5 rounded-xl border border-slate-100 shadow-3xs italic">
                              "{song.observations}"
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Nenhuma observação técnica cadastrada.</p>
                          )}

                          {song.bpm && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-600 mt-2 bg-slate-100 px-2 py-0.5 rounded">
                              <Activity className="h-3 w-3 text-slate-400" />
                              Andamento: {song.bpm} BPM
                            </span>
                          )}
                        </div>

                        {/* Alternate keys block */}
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Versões em Tons Alternativos</span>
                          {song.versions && song.versions.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {song.versions.map((ver, vIdx) => (
                                <span key={vIdx} className="bg-white border border-slate-100 py-1 px-2.5 rounded-lg text-[10px] text-slate-700 shadow-3xs font-medium">
                                  {ver.name}: <strong className="text-slate-900 font-mono">{ver.tone}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Apenas o tom original cadastrado.</p>
                          )}
                        </div>
                      </div>

                      {/* Embed links dashboard */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          {/* Chords */}
                          {song.chordsUrl && (
                            <a
                              href={song.chordsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/40 rounded-xl flex items-center gap-1 transition"
                            >
                              <FileText className="h-3 w-3 text-indigo-505" />
                              Ver Cifra Completa
                            </a>
                          )}

                          {/* Lyrics */}
                          {song.lyricsUrl && (
                            <a
                              href={song.lyricsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350 rounded-xl flex items-center gap-1 transition"
                            >
                              <Link className="h-3 w-3 text-slate-500" />
                              Ler Letra Inteira
                            </a>
                          )}

                          {/* Spotify */}
                          {song.audioUrl && (
                            <a
                              href={song.audioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 rounded-xl flex items-center gap-1 transition"
                            >
                              <ListMusic className="h-3 w-3 text-emerald-600" />
                              Spotify Audio
                            </a>
                          )}

                          {/* YouTube */}
                          {song.videoUrl && (
                            <a
                              href={song.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold px-3 py-1.5 bg-red-50 hover:bg-red-105 text-red-700 rounded-xl border border-red-200/50 flex items-center gap-1 transition"
                            >
                              <Video className="h-3 w-3 text-red-505" />
                              Pesquisa YouTube Video
                            </a>
                          )}
                        </div>

                        {/* Admin / Cantor Edit & Delete buttons */}
                        {isLiderOrCantor && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(song)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 py-1 px-2 rounded-lg hover:bg-indigo-55/40 transition font-bold cursor-pointer"
                            >
                              Editar Louvor
                            </button>
                            <span className="text-slate-350 text-[10px]">|</span>
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza de que quer remover "' + song.title + '" do repertório do Belvedere?')) {
                                  onDeleteSong(song.id);
                                }
                              }}
                              className="text-[10px] text-red-600 hover:text-red-800 py-1 px-2 rounded-lg hover:bg-red-50 transition font-bold cursor-pointer"
                            >
                              Excluir Louvor
                            </button>
                          </div>
                        )}
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
                
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
