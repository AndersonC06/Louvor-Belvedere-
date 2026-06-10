/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { Scale, Song, ScaleParticipant, UserProfile } from '../types';
import { 
  Calendar, Clock, Music, User, Trash2, Plus, Search, 
  X, Check, ExternalLink, MessageSquare, Play, Sparkles, Filter, AlertTriangle,
  Download, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';

interface ScalesTabProps {
  currentUser: UserProfile;
  scales: Scale[];
  songs: Song[];
  users: UserProfile[];
  onAddScale: (scale: Scale) => void;
  onUpdateScale: (scale: Scale) => void;
  onDeleteScale: (scaleId: string) => void;
}

export default function ScalesTab({
  currentUser,
  scales,
  songs,
  users,
  onAddScale,
  onUpdateScale,
  onDeleteScale
}: ScalesTabProps) {
  // Published / Draft Filter Toggle
  const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published');
  
  // Selection scale for Detailed Modal
  const [inspectedScale, setInspectedScale] = useState<Scale | null>(null);

  // Image exporting states & ref
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = React.useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!exportRef.current || !inspectedScale) return;
    setIsExporting(true);
    try {
      // 350ms to allow layouts to settle
      await new Promise((resolve) => setTimeout(resolve, 350));
      
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: '#ffffff',
        width: 600,
        pixelRatio: 3, // Multiplies resolution by 3x for ultra-sharp High-DPI quality
        style: {
          transform: 'scale(1)',
          borderRadius: '0px',
        },
        cacheBust: true,
      });

      const cleanTitle = inspectedScale.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `escala_${cleanTitle || 'louvor'}_${inspectedScale.date}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar escala em imagem:', error);
      alert('Não foi possível gerar a imagem da escala automaticamente. Tente fazer um print manual ou tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Keep inspectedScale in sync with latest scales prop
  React.useEffect(() => {
    if (inspectedScale) {
      const latestScale = scales.find(s => s.id === inspectedScale.id);
      if (latestScale) {
        setInspectedScale(latestScale);
      } else {
        setInspectedScale(null);
      }
    }
  }, [scales, inspectedScale?.id]);

  // Form Creation Scale States
  const [isCreatingScale, setIsCreatingScale] = useState(false);
  const [editingScaleId, setEditingScaleId] = useState<string | null>(null);
  const [scaleTitle, setScaleTitle] = useState('');
  const [scaleDesc, setScaleDesc] = useState('');
  const [scaleDate, setScaleDate] = useState('');
  const [scaleTime, setScaleTime] = useState('09:00 e 18:00');
  const [scaleType, setScaleType] = useState<'domingo' | 'terca' | 'ebd' | 'sabado' | 'outro'>('domingo');
  const [scalePlaylist, setScalePlaylist] = useState('');
  
  // Songs and people alocated in creator state
  const [creatorSongIds, setCreatorSongIds] = useState<string[]>([]);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [creatorSongLeaders, setCreatorSongLeaders] = useState<Record<string, string>>({});
  const [creatorSongNotes, setCreatorSongNotes] = useState<Record<string, string>>({});
  const [creatorSongSlot, setCreatorSongSlot] = useState<Record<string, string>>({});

  // Participants creation state (retaining flat array for consistency, but managed via templates)
  const [slotBaterista, setSlotBaterista] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [slotTecladista, setSlotTecladista] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [slotGuitarrista, setSlotGuitarrista] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [slotBaixista, setSlotBaixista] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [slotCantor1, setSlotCantor1] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [slotCantor2, setSlotCantor2] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [slotCantor3, setSlotCantor3] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [slotViolao, setSlotViolao] = useState<{ userId: string; shift: '1' | '2' | 'both' }>({ userId: '', shift: 'both' });
  const [creatorExtraParticipants, setCreatorExtraParticipants] = useState<ScaleParticipant[]>([]);
  
  // Helper for adding extra participant to creator scale
  const [pSelectUser, setPSelectUser] = useState('');
  const [pSelectRole, setPSelectRole] = useState('Vocalista');
  const [pSelectShift, setPSelectShift] = useState<'1' | '2' | 'both'>('both');

  // Search song lists matches in form
  const queriedSongs = songs.filter(s => 
    s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(songSearchQuery.toLowerCase())
  ).slice(0, 5);

  const addSongToCreatorList = (song: Song) => {
    if (creatorSongIds.includes(song.id)) return;
    setCreatorSongIds([...creatorSongIds, song.id]);
    // Set default values for notes and moment slots
    setCreatorSongSlot(prev => ({ ...prev, [song.id]: 'adoração' }));
    setSongSearchQuery('');
  };

  const removeSongFromCreatorList = (songId: string) => {
    setCreatorSongIds(creatorSongIds.filter(id => id !== songId));
    // Clear associations
    const copyLeaders = { ...creatorSongLeaders };
    delete copyLeaders[songId];
    setCreatorSongLeaders(copyLeaders);

    const copyNotes = { ...creatorSongNotes };
    delete copyNotes[songId];
    setCreatorSongNotes(copyNotes);

    const copySlots = { ...creatorSongSlot };
    delete copySlots[songId];
    setCreatorSongSlot(copySlots);
  };

  const addExtraParticipantToCreatorList = () => {
    if (!pSelectUser) return;
    const matchedProfile = users.find(u => u.id === pSelectUser);
    if (!matchedProfile) return;

    // Check pre-existence in extras
    if (creatorExtraParticipants.some(p => p.userId === pSelectUser)) {
      alert('Este integrante extra já foi escalado!');
      return;
    }

    const nParticipant: ScaleParticipant = {
      userId: pSelectUser,
      name: matchedProfile.name,
      avatarUrl: matchedProfile.avatarUrl,
      role: pSelectRole || 'Extra',
      status: 'confirmed',
      shift: pSelectShift
    };

    setCreatorExtraParticipants([...creatorExtraParticipants, nParticipant]);
    setPSelectUser('');
    setPSelectRole('Vocalista');
  };

  const removeExtraParticipantFromCreatorList = (userId: string) => {
    setCreatorExtraParticipants(creatorExtraParticipants.filter(p => p.userId !== userId));
  };

  const batchLinkSlotsToShift = (shift: '1' | '2' | 'both') => {
    const slotsToMigrate = [
      { uState: slotBaterista, role: 'Baterista', setter: setSlotBaterista },
      { uState: slotTecladista, role: 'Tecladista', setter: setSlotTecladista },
      { uState: slotGuitarrista, role: 'Guitarrista', setter: setSlotGuitarrista },
      { uState: slotBaixista, role: 'Baixista', setter: setSlotBaixista },
      { uState: slotCantor1, role: 'Cantor 1', setter: setSlotCantor1 },
      { uState: slotCantor2, role: 'Cantor 2', setter: setSlotCantor2 },
      { uState: slotCantor3, role: 'Cantor 3', setter: setSlotCantor3 },
      { uState: slotViolao, role: 'Violão', setter: setSlotViolao },
    ];

    const newExtras: ScaleParticipant[] = [...creatorExtraParticipants];
    let migratedCount = 0;

    slotsToMigrate.forEach(({ uState, role, setter }) => {
      if (uState.userId) {
        const matchedProfile = users.find(u => u.id === uState.userId);
        if (matchedProfile) {
          const alreadyExists = newExtras.some(
            e => e.userId === uState.userId && e.role === role && e.shift === shift
          );
          if (!alreadyExists) {
            newExtras.push({
              userId: uState.userId,
              name: matchedProfile.name,
              avatarUrl: matchedProfile.avatarUrl,
              role: role,
              status: 'confirmed',
              shift: shift
            });
            migratedCount++;
          }
          setter({ userId: '', shift: 'both' });
        }
      }
    });

    if (migratedCount > 0) {
      setCreatorExtraParticipants(newExtras);
    } else {
      alert('Selecione pelo menos um integrante nos campos acima antes de vincular!');
    }
  };

  const handleStartEditScale = (scale: Scale) => {
    setEditingScaleId(scale.id);
    setScaleTitle(scale.title);
    setScaleDesc(scale.description || '');
    setScaleDate(scale.date);
    setScaleTime(scale.time);
    setScaleType(scale.scaleType);
    setScalePlaylist(scale.playlistUrl || '');
    setCreatorSongIds(scale.songIds || []);
    setCreatorSongLeaders(scale.songLeaders || {});
    setCreatorSongNotes(scale.songNotes || {});
    setCreatorSongSlot(scale.songSlot || {});
    
    // Load and map participants into dedicated template slots
    const parts = scale.participants || [];
    const assignedIds = new Set<string>();

    const bPart = parts.find(p => p.role === 'Baterista' || p.role.toLowerCase() === 'bateria');
    if (bPart) {
      setSlotBaterista({ userId: bPart.userId, shift: bPart.shift });
      assignedIds.add(bPart.userId);
    } else {
      setSlotBaterista({ userId: '', shift: 'both' });
    }

    const tPart = parts.find(p => !assignedIds.has(p.userId) && (p.role === 'Tecladista' || p.role.toLowerCase() === 'teclado' || p.role.toLowerCase() === 'piano'));
    if (tPart) {
      setSlotTecladista({ userId: tPart.userId, shift: tPart.shift });
      assignedIds.add(tPart.userId);
    } else {
      setSlotTecladista({ userId: '', shift: 'both' });
    }

    const gPart = parts.find(p => !assignedIds.has(p.userId) && (p.role === 'Guitarrista' || p.role.toLowerCase() === 'guitarra' || p.role.toLowerCase() === 'violão' || p.role.toLowerCase() === 'violao'));
    if (gPart) {
      setSlotGuitarrista({ userId: gPart.userId, shift: gPart.shift });
      assignedIds.add(gPart.userId);
    } else {
      setSlotGuitarrista({ userId: '', shift: 'both' });
    }

    const baPart = parts.find(p => !assignedIds.has(p.userId) && (p.role === 'Baixista' || p.role.toLowerCase() === 'baixo'));
    if (baPart) {
      setSlotBaixista({ userId: baPart.userId, shift: baPart.shift });
      assignedIds.add(baPart.userId);
    } else {
      setSlotBaixista({ userId: '', shift: 'both' });
    }

    const vocalParts = parts.filter(p => !assignedIds.has(p.userId) && (p.role.includes('Cantor') || p.role.toLowerCase().includes('vocal') || p.role.toLowerCase().includes('voz') || p.role.toLowerCase().includes('ministro') || p.role.toLowerCase().includes('back')));

    if (vocalParts[0]) {
      setSlotCantor1({ userId: vocalParts[0].userId, shift: vocalParts[0].shift });
      assignedIds.add(vocalParts[0].userId);
    } else {
      setSlotCantor1({ userId: '', shift: 'both' });
    }

    if (vocalParts[1]) {
      setSlotCantor2({ userId: vocalParts[1].userId, shift: vocalParts[1].shift });
      assignedIds.add(vocalParts[1].userId);
    } else {
      setSlotCantor2({ userId: '', shift: 'both' });
    }

    if (vocalParts[2]) {
      setSlotCantor3({ userId: vocalParts[2].userId, shift: vocalParts[2].shift });
      assignedIds.add(vocalParts[2].userId);
    } else {
      setSlotCantor3({ userId: '', shift: 'both' });
    }

    const vPart = parts.find(p => !assignedIds.has(p.userId) && (p.role === 'Violonista' || p.role === 'Violão' || p.role.toLowerCase() === 'violão' || p.role.toLowerCase() === 'violao'));
    if (vPart) {
      setSlotViolao({ userId: vPart.userId, shift: vPart.shift });
      assignedIds.add(vPart.userId);
    } else {
      setSlotViolao({ userId: '', shift: 'both' });
    }

    const extras = parts.filter(p => !assignedIds.has(p.userId));
    setCreatorExtraParticipants(extras);

    setIsCreatingScale(true);
    // Scroll up smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = (e: FormEvent, forceStatus: 'draft' | 'published') => {
    e.preventDefault();
    if (!scaleTitle || !scaleDate) {
      alert('Preencha pelo menos o Título do Culto e a Data do evento!');
      return;
    }

    // Build the final participants array
    const finalParticipants: ScaleParticipant[] = [];

    const addSlot = (uState: { userId: string; shift: '1' | '2' | 'both' }, roleName: string) => {
      if (!uState.userId) return;
      const matchedProfile = users.find(u => u.id === uState.userId);
      if (!matchedProfile) return;
      finalParticipants.push({
        userId: uState.userId,
        name: matchedProfile.name,
        avatarUrl: matchedProfile.avatarUrl,
        role: roleName,
        status: 'confirmed', // forced confirmed to eliminate friction
        shift: uState.shift
      });
    };

    addSlot(slotBaterista, 'Baterista');
    addSlot(slotTecladista, 'Tecladista');
    addSlot(slotGuitarrista, 'Guitarrista');
    addSlot(slotBaixista, 'Baixista');
    addSlot(slotCantor1, 'Cantor 1');
    addSlot(slotCantor2, 'Cantor 2');
    addSlot(slotCantor3, 'Cantor 3');
    addSlot(slotViolao, 'Violão');

    creatorExtraParticipants.forEach(cp => {
      finalParticipants.push({
        ...cp,
        status: 'confirmed'
      });
    });

    if (editingScaleId) {
      const scaleObj: Scale = {
        id: editingScaleId,
        title: scaleTitle,
        description: scaleDesc,
        date: scaleDate,
        time: scaleTime,
        playlistUrl: scalePlaylist,
        scaleType,
        status: forceStatus,
        songIds: creatorSongIds,
        songLeaders: creatorSongLeaders,
        songNotes: creatorSongNotes,
        songSlot: creatorSongSlot,
        participants: finalParticipants
      };

      onUpdateScale(scaleObj);
      alert(`Escala atualizada com sucesso como ${forceStatus === 'published' ? 'Publicada' : 'Rascunho'}!`);
      setEditingScaleId(null);
    } else {
      const newScaleId = 'sc_' + (scales.length + 1) + '_' + Math.floor(Math.random() * 90 + 10);
      const scaleObj: Scale = {
        id: newScaleId,
        title: scaleTitle,
        description: scaleDesc,
        date: scaleDate,
        time: scaleTime,
        playlistUrl: scalePlaylist,
        scaleType,
        status: forceStatus,
        songIds: creatorSongIds,
        songLeaders: creatorSongLeaders,
        songNotes: creatorSongNotes,
        songSlot: creatorSongSlot,
        participants: finalParticipants
      };

      onAddScale(scaleObj);
      alert(`Escala cadastrada com sucesso como ${forceStatus === 'published' ? 'Publicada' : 'Rascunho'}!`);
    }
    
    // Reset Form
    setScaleTitle('');
    setScaleDesc('');
    setScaleDate('');
    setScaleTime('09:00 e 18:00');
    setScaleType('domingo');
    setScalePlaylist('');
    setCreatorSongIds([]);
    setCreatorSongLeaders({});
    setCreatorSongNotes({});
    setCreatorSongSlot({});
    setSlotBaterista({ userId: '', shift: 'both' });
    setSlotTecladista({ userId: '', shift: 'both' });
    setSlotGuitarrista({ userId: '', shift: 'both' });
    setSlotBaixista({ userId: '', shift: 'both' });
    setSlotCantor1({ userId: '', shift: 'both' });
    setSlotCantor2({ userId: '', shift: 'both' });
    setSlotCantor3({ userId: '', shift: 'both' });
    setSlotViolao({ userId: '', shift: 'both' });
    setCreatorExtraParticipants([]);
    setIsCreatingScale(false);
  };

  // Immediate Toggle response status inside Detail Modal
  const respondImmediateToInspected = (status: 'confirmed' | 'declined') => {
    if (!inspectedScale) return;
    const updatedParticipants = inspectedScale.participants.map(p => {
      if (p.userId === currentUser.id) {
        return { ...p, status };
      }
      return p;
    });

    const updatedScale = { ...inspectedScale, participants: updatedParticipants };
    onUpdateScale(updatedScale);
    setInspectedScale(updatedScale); // Redraw modal values
  };

  // Toggle Publish / Rascunho status for scale
  const toggleScaleStatus = (scale: Scale) => {
    const nextStatus = scale.status === 'published' ? 'draft' : 'published';
    onUpdateScale({ ...scale, status: nextStatus });
    alert(`Escala alterada para: ${nextStatus === 'published' ? 'Publicada (Visível)' : 'Rascunho (Privada)'}`);
    if (inspectedScale?.id === scale.id) {
      setInspectedScale({ ...scale, status: nextStatus });
    }
  };

  // Filter scales for visualization list
  const currentFilteredScales = scales.filter(s => s.status === activeTab);

  // Helper date formatter BR
  const formatDateBR = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div id="scales-tab-scroller" className="space-y-6 max-w-4xl mx-auto selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      
      {/* Search Header toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Switcher published vs drafts */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('published')}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'published'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Escalas Publicadas ({scales.filter(s => s.status === 'published').length})
          </button>
          
          <button
            onClick={() => setActiveTab('draft')}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'draft'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Rascunhos Gerais ({scales.filter(s => s.status === 'draft').length})
          </button>
        </div>

        {/* Add scale trigger */}
        {currentUser.isAdmin && (
          <button
            onClick={() => setIsCreatingScale(!isCreatingScale)}
            className="text-xs font-semibold py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white decoration-none flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
          >
            {isCreatingScale ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isCreatingScale ? 'Fechar Construtor' : 'Montar Nova Escala'}
          </button>
        )}
      </div>

      {isCreatingScale ? (
        /* Create Scale Form Box with motion */
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-md"
        >
          <div className="flex items-center gap-2 text-indigo-600 mb-4 border-b border-slate-100 pb-3">
            <Sparkles className="h-5 w-5" />
            <h4 className="font-sans font-bold text-slate-900 text-base">Novo Planejamento de Culto</h4>
          </div>

          <form onSubmit={(e) => handleFormSubmit(e, 'published')} className="space-y-5">
            
            {/* Row 1: Title, Date, Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título do Culto / Evento</label>
                <input
                  type="text"
                  placeholder="Ex: Culto da Vitória"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  value={scaleTitle}
                  onChange={(e) => setScaleTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Data Realização</label>
                <input
                  type="date"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  value={scaleDate}
                  onChange={(e) => setScaleDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Horários / Turnos</label>
                <input
                  type="text"
                  placeholder="Ex: 09:00 e 18:00"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  value={scaleTime}
                  onChange={(e) => setScaleTime(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Type, Playlist, Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Categoria de Agenda</label>
                <select
                  value={scaleType}
                  onChange={(e) => setScaleType(e.target.value as any)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="domingo">Domingo (Tradicional)</option>
                  <option value="terca">Terça de Clamor</option>
                  <option value="ebd">Escola Bíblica (EBD)</option>
                  <option value="sabado">Sábado de Jovens</option>
                  <option value="outro">Outro Evento Especial</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Avisos e Instruções Gerais da Escala</label>
                <input
                  type="text"
                  placeholder="Observação pastoral sobre ensaio, jejum ou roupas da equipe..."
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                  value={scaleDesc}
                  onChange={(e) => setScaleDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Link para Playlist de Ensaio (Spotify / YouTube)</label>
                <input
                  type="url"
                  placeholder="https://open.spotify.com/playlist/..."
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-slate-800"
                  value={scalePlaylist}
                  onChange={(e) => setScalePlaylist(e.target.value)}
                />
              </div>
            </div>

            {/* Seção 1: Adicionar Músicas */}
            <div className="border border-slate-100 p-4 rounded-2xl bg-indigo-50/20 space-y-3.5">
              <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                <Music className="h-3.5 w-3.5 text-indigo-505" />
                Setlist do Culto
              </h5>

              {/* Advanced song search & list add */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Digitar para buscar músicas por título ou cantor..."
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-slate-800 focus:outline-none"
                />

                {songSearchQuery && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-[160px] overflow-y-auto p-1.5 space-y-1">
                    {queriedSongs.length === 0 ? (
                      <div className="p-2 text-center text-[11px] text-slate-400">Nenhum louvor correspondente.</div>
                    ) : (
                      queriedSongs.map(item => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => addSongToCreatorList(item)}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-100 font-medium text-xs text-slate-800 flex justify-between items-center cursor-pointer"
                        >
                          <span>{item.title} - <strong className="text-slate-500 font-normal">{item.artist}</strong></span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 py-0.5 px-2 rounded-full uppercase font-mono">{item.tone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Setlist Added List */}
              {creatorSongIds.length === 0 ? (
                <div className="text-center py-2.5 text-[11px] text-slate-400 italic">Nenhum louvor adicionado ao repertório deste culto ainda. Busque acima para começar!</div>
              ) : (
                <div className="space-y-3 pt-1">
                  {creatorSongIds.map((songId, index) => {
                    const song = songs.find(s => s.id === songId);
                    if (!song) return null;

                    return (
                      <div key={songId} className="p-3 bg-white border border-slate-100 rounded-xl flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                        {/* Title and artist */}
                        <div className="flex items-center gap-2.5 leading-tight">
                          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">{index + 1}</span>
                          <div>
                            <h6 className="text-xs font-bold text-slate-900">{song.title}</h6>
                            <span className="text-[10px] text-slate-500 font-mono">Sugerida em: {song.tone} / {song.artist}</span>
                          </div>
                        </div>

                        {/* Configure fields */}
                        <div className="flex flex-wrap gap-2 items-center flex-1 justify-end w-full md:w-auto">
                          
                          {/* Segment Selector */}
                          <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[10px]">
                            {['celebração', 'oferta', 'adoração'].map(slot => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setCreatorSongSlot(p => ({ ...p, [songId]: slot }))}
                                className={`px-2 py-0.5 rounded capitalize font-medium cursor-pointer ${
                                  creatorSongSlot[songId] === slot 
                                    ? 'bg-indigo-600 text-white font-semibold' 
                                    : 'text-slate-600 hover:text-slate-800'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>

                          {/* Leader assignment */}
                          <select
                            value={creatorSongLeaders[songId] || ''}
                            onChange={(e) => setCreatorSongLeaders(p => ({ ...p, [songId]: e.target.value }))}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] max-w-[120px]"
                          >
                            <option value="">(Sem Solo/Solista)</option>
                            {users.map(u => (
                              <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                          </select>

                          {/* Details note */}
                          <input
                            type="text"
                            placeholder="Avisos, tons..."
                            value={creatorSongNotes[songId] || ''}
                            onChange={(e) => setCreatorSongNotes(p => ({ ...p, [songId]: e.target.value }))}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-[10px] placeholder-slate-400 max-w-[130px]"
                          />

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removeSongFromCreatorList(songId)}
                            className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção 2: Alocação de Equipe */}
            <div className="border border-slate-100 p-4 md:p-5 rounded-2xl bg-indigo-50/20 space-y-4">
              <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-100/40 pb-2">
                <User className="h-4 w-4 text-indigo-600" />
                Montagem da Escala Fixa Obrigatória
              </h5>

              <p className="text-[11px] text-slate-500 leading-normal">
                Selecione os integrantes obrigatórios para cada uma das posições fixas da escala. Ao clicar em cada campo, apenas os instrumentistas ou cantores com a respectiva qualificação cadastrada no perfil aparecerão.
              </p>

              {/* Grid of the 7 fixed spots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* Baterista */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">⚡ Baterista (Fixo)</label>
                    <select
                      value={slotBaterista.userId}
                      onChange={(e) => setSlotBaterista({ ...slotBaterista, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Baterista)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('bater'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotBaterista.shift}
                      onChange={(e) => setSlotBaterista({ ...slotBaterista, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

                {/* Tecladista */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">🎹 Tecladista (Fixo)</label>
                    <select
                      value={slotTecladista.userId}
                      onChange={(e) => setSlotTecladista({ ...slotTecladista, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Tecladista)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('teclad') || r.toLowerCase().includes('piano'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotTecladista.shift}
                      onChange={(e) => setSlotTecladista({ ...slotTecladista, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

                {/* Guitarrista */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">🎸 Guitarrista (Fixo)</label>
                    <select
                      value={slotGuitarrista.userId}
                      onChange={(e) => setSlotGuitarrista({ ...slotGuitarrista, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Guitarrista)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('guit') || r.toLowerCase().includes('violã') || r.toLowerCase().includes('violao'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotGuitarrista.shift}
                      onChange={(e) => setSlotGuitarrista({ ...slotGuitarrista, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

                {/* Baixista */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">🎻 Baixista (Fixo)</label>
                    <select
                      value={slotBaixista.userId}
                      onChange={(e) => setSlotBaixista({ ...slotBaixista, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Baixista)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('baix'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotBaixista.shift}
                      onChange={(e) => setSlotBaixista({ ...slotBaixista, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

                {/* Cantor 1 */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">🎤 Cantor 1 (Fixo)</label>
                    <select
                      value={slotCantor1.userId}
                      onChange={(e) => setSlotCantor1({ ...slotCantor1, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Cantor 1)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('voz') || r.toLowerCase().includes('voc') || r.toLowerCase().includes('back') || r.toLowerCase().includes('cant') || r.toLowerCase().includes('ministr'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotCantor1.shift}
                      onChange={(e) => setSlotCantor1({ ...slotCantor1, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

                {/* Cantor 2 */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">🎤 Cantor 2 (Fixo)</label>
                    <select
                      value={slotCantor2.userId}
                      onChange={(e) => setSlotCantor2({ ...slotCantor2, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Cantor 2)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('voz') || r.toLowerCase().includes('voc') || r.toLowerCase().includes('back') || r.toLowerCase().includes('cant') || r.toLowerCase().includes('ministr'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotCantor2.shift}
                      onChange={(e) => setSlotCantor2({ ...slotCantor2, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

                {/* Cantor 3 */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs text-slate-850">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">🎤 Cantor 3 (Fixo)</label>
                    <select
                      value={slotCantor3.userId}
                      onChange={(e) => setSlotCantor3({ ...slotCantor3, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Cantor 3)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('voz') || r.toLowerCase().includes('voc') || r.toLowerCase().includes('back') || r.toLowerCase().includes('cant') || r.toLowerCase().includes('ministr'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotCantor3.shift}
                      onChange={(e) => setSlotCantor3({ ...slotCantor3, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

                {/* Violão */}
                <div className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-3xs text-slate-850">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold uppercase text-indigo-700 mb-1">🎸 Violão (Fixo)</label>
                    <select
                      value={slotViolao.userId}
                      onChange={(e) => setSlotViolao({ ...slotViolao, userId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-150 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">(Vazio - Sem Violão)</option>
                      {users.filter(u => u.roles.some(r => r.toLowerCase().includes('viol') || r.toLowerCase().includes('guit') || r.toLowerCase().includes('violão'))).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-[110px] shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Turno</label>
                    <select
                      value={slotViolao.shift}
                      onChange={(e) => setSlotViolao({ ...slotViolao, shift: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Botões de vinculação em lote */}
              <div className="mt-4 pt-4 border-t border-indigo-100/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/75 p-3 rounded-xl border border-slate-200/60">
                <div className="text-left space-y-0.5">
                  <h6 className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1">⚡ Vincular Integrantes por Turno</h6>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Preencheu o time de cima? Escolha o turno abaixo para vinculá-los todos de uma só vez à lista da escala e liberar os slots para preencher o próximo turno!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 justify-end w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => batchLinkSlotsToShift('1')}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-200/80 transition cursor-pointer"
                  >
                    Vincular ao 1º Horário
                  </button>
                  <button
                    type="button"
                    onClick={() => batchLinkSlotsToShift('2')}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-200/80 transition cursor-pointer"
                  >
                    Vincular ao 2º Horário
                  </button>
                  <button
                    type="button"
                    onClick={() => batchLinkSlotsToShift('both')}
                    className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
                  >
                    Vincular a Ambos
                  </button>
                </div>
              </div>

              {/* Extra selections block */}
              <div className="border border-dashed border-indigo-200 p-3.5 bg-white rounded-xl space-y-3">
                <label className="block text-[10px] font-extrabold uppercase text-indigo-950">🪄 Caso precise de mais integrantes (Seleção Extra)</label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Membro Extra</label>
                    <select
                      value={pSelectUser}
                      onChange={(e) => setPSelectUser(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:bg-white"
                    >
                      <option value="">Escolher qualquer integrante...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Atuação / Instrumento</label>
                    <input
                      type="text"
                      placeholder="Ex: Violão, Flauta, Sax, Backing..."
                      value={pSelectRole}
                      onChange={(e) => setPSelectRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Turno de Serviço</label>
                    <select
                      value={pSelectShift}
                      onChange={(e) => setPSelectShift(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                    >
                      <option value="both">Ambos</option>
                      <option value="1">1º Horário</option>
                      <option value="2">2º Horário</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={addExtraParticipantToCreatorList}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-1.5 text-xs font-bold transition flex items-center justify-center cursor-pointer h-[34px]"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Listed extras */}
                {creatorExtraParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {creatorExtraParticipants.map(partCell => (
                      <div key={partCell.userId} className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-3xs">
                        <img 
                          src={partCell.avatarUrl} 
                          alt={partCell.name} 
                          className="h-4.5 w-4.5 rounded bg-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-[10px]">
                          <strong className="text-slate-800">{partCell.name}</strong> 
                          <span className="text-slate-400 mx-1">•</span> 
                          <span className="text-indigo-600 font-semibold">{partCell.role}</span>
                          <span className="bg-slate-250 text-slate-700 px-1 rounded ml-1 text-[9px] font-mono">
                            {partCell.shift === 'both' ? 'Geral' : `${partCell.shift}º Hor`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExtraParticipantFromCreatorList(partCell.userId)}
                          className="text-slate-400 hover:text-red-500 transition p-0.5 ml-1 cursor-pointer font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Scale Publish selection actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreatingScale(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Voltar
              </button>
              
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={(e) => handleFormSubmit(e, 'draft')}
                  className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition border border-slate-300"
                >
                  Salvar Rascunho
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Publicar Escala Geral
                </button>
              </div>
            </div>

          </form>
        </motion.div>
      ) : null}

      {/* Main Lists of Scales */}
      {currentFilteredScales.length === 0 ? (
        <div id="no-scales" className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-900">Nenhuma escala ativa</h4>
          <p className="text-xs text-slate-400 mt-1">Este feed está sem reuniões agendadas no estado "{activeTab === 'published' ? 'Publicadas' : 'Rascunhos'}" para o ministério Belvedere.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentFilteredScales.map((scale) => {
            // Check status of current user
            const myStatusObj = scale.participants.find(p => p.userId === currentUser.id);
            const myStatusText = myStatusObj ? myStatusObj.status : null;

            return (
              <motion.div
                key={scale.id}
                whileHover={{ scale: 1.012 }}
                onClick={() => setInspectedScale(scale)}
                className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden transition-all duration-200 group flex flex-col justify-between ${
                  scale.status === 'draft' ? 'border-dashed border-indigo-350' : 'border-slate-200'
                }`}
              >
                
                {scale.status === 'draft' && (
                  <span className="absolute top-3 right-3 bg-indigo-150 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full z-10 font-mono uppercase">
                    Rascunho Líderes
                  </span>
                )}

                <div>
                  {/* Category badg & Schedule information */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-200/50 py-0.5 px-2 rounded-lg">
                      {scale.scaleType === 'domingo' ? '⛪ Domingo Geral' :
                       scale.scaleType === 'terca' ? '🙌 Terça Clamor' :
                       scale.scaleType === 'ebd' ? '📖 EBD Estudo' :
                       scale.scaleType === 'sabado' ? '🔥 Sábado Jovens' : '🌟 Especial'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {formatDateBR(scale.date)}
                    </span>
                  </div>

                  {/* Title & Description of Worship */}
                  <h3 className="text-sm font-sans font-bold text-slate-900 group-hover:text-indigo-600 transition tracking-tight">
                    {scale.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {scale.description || 'Nenhum aviso pastoral adicionado.'}
                  </p>

                  <div className="flex gap-4 items-center text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {scale.time}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Music className="h-3.5 w-3.5 text-slate-400" />
                      {scale.songIds.length} Canções
                    </span>
                  </div>
                </div>

                {/* Team Avatars Footer */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {scale.participants.slice(0, 5).map((part, pIdx) => (
                      <div key={pIdx} className="relative group/avatar">
                        <img
                          src={part.avatarUrl}
                          alt={part.name}
                          className="h-6 w-6 rounded-full bg-indigo-50 border border-slate-200 p-0.5"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                    {scale.participants.length > 5 && (
                      <span className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 font-mono">
                        +{scale.participants.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Líder Action buttons on card */}
                {(currentUser.role === 'Líder' || currentUser.isAdmin) && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleStartEditScale(scale)}
                      className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-slate-205 py-1.5 px-3 rounded-xl transition cursor-pointer"
                    >
                      Editar Escala
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza de que quer excluir totalmente a escala de "${scale.title}"?`)) {
                          onDeleteScale(scale.id);
                        }
                      }}
                      className="text-[10px] font-bold text-red-650 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-xl transition cursor-pointer"
                    >
                      Excluir Escala
                    </button>
                  </div>
                )}

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Advanced Overlay Inspection Modal */}
      <AnimatePresence>
        {inspectedScale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-2xl max-w-2xl w-full my-6 flex flex-col justify-between"
            >
              
              {/* Header inside modal */}
              <div className="flex justify-between items-start mb-4 border-b border-slate-150 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 py-0.5 px-2 rounded-lg uppercase">
                      {inspectedScale.scaleType}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{formatDateBR(inspectedScale.date)} - {inspectedScale.time}</span>
                  </div>
                  <h3 className="text-base font-sans font-bold text-slate-900 mt-1 max-w-[400px]">{inspectedScale.title}</h3>
                </div>
                
                <button
                  onClick={() => setInspectedScale(null)}
                  className="p-1 rounded-lg bg-slate-105 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="space-y-4">
                
                {/* Description */}
                {inspectedScale.description && (
                  <div className="p-3 bg-indigo-50/20 border border-indigo-200/10 rounded-2xl text-xs text-slate-700 leading-relaxed">
                    <strong>Avisos Gerais:</strong> {inspectedScale.description}
                  </div>
                )}

                {/* Playlist URL button links */}
                {inspectedScale.playlistUrl && (
                  <a
                    href={inspectedScale.playlistUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3.5 rounded-xl border border-emerald-200/50 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                    Playlist de Ensaio • Ouvir Canto
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {/* Grid 2 Column: Setlist & Team */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
                  
                  {/* Col A: Setlist - Segmented (7/12 width) */}
                  <div className="md:col-span-7 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                      <Music className="h-4 w-4 text-indigo-500" />
                      Setlist Planejado ({inspectedScale.songIds.length} Canções)
                    </h4>

                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                      {inspectedScale.songIds.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400 italic">Nenhum louvor no setlist.</div>
                      ) : (
                        ((['celebração', 'oferta', 'adoração'] as const).map(slotKey => {
                          const slotSongs = inspectedScale.songIds.filter(songId => inspectedScale.songSlot?.[songId] === slotKey);
                          
                          return (
                            <div key={slotKey} className="border border-indigo-100 bg-white rounded-2xl p-3 space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between border-b border-indigo-50 pb-1 mb-1 bg-indigo-50/10 px-2 py-1 rounded">
                                <h5 className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                                  {slotKey === 'celebração' ? '✨ CELEBRAÇÃO (Louvor Alegre)' :
                                   slotKey === 'oferta' ? '🪙 OFERTA (Dízimos / Avisos)' :
                                   '🙏 ADORAÇÃO (Cânticos e Ministração)'}
                                </h5>
                                <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 px-1.5 rounded-full">
                                  {slotSongs.length}
                                </span>
                              </div>

                              {slotSongs.length === 0 ? (
                                <div className="text-[9px] text-slate-400 italic pl-2.5 py-1">Nenhum louvor neste momento.</div>
                              ) : (
                                <div className="space-y-2">
                                  {slotSongs.map((songId) => {
                                    const sObj = songs.find(s => s.id === songId);
                                    if (!sObj) return null;

                                    const leadText = inspectedScale.songLeaders?.[songId];
                                    const songNote = inspectedScale.songNotes?.[songId];

                                    return (
                                      <div key={songId} className="p-2 rounded-xl bg-slate-50/80 border border-slate-150/45 hover:bg-slate-100/50 transition">
                                        <div className="flex items-center justify-between gap-1">
                                          <div>
                                            <span className="text-xs font-bold text-slate-900 leading-tight block">{sObj.title}</span>
                                            <span className="text-[9px] text-slate-500 font-mono">Por: {sObj.artist}</span>
                                          </div>
                                          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold px-1.5 rounded">
                                            {sObj.tone}
                                          </span>
                                        </div>

                                        {leadText && (
                                          <div className="text-[9px] text-indigo-700 font-bold mt-1.5">
                                            Solista: <span className="underline">{leadText}</span>
                                          </div>
                                        )}
                                        {songNote && (
                                          <div className="text-[9px] text-slate-500 italic mt-0.5 leading-tight">
                                            💡 Observação: {songNote}
                                          </div>
                                        )}

                                        {/* If current user is Leader, let them remap the slot in real-time */}
                                        {(currentUser.role === 'Líder' || currentUser.isAdmin) && (
                                          <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-slate-200">
                                            <span className="text-[8px] text-slate-400 font-extrabold uppercase mr-1">Remover/Mudar:</span>
                                            {(['celebração', 'oferta', 'adoração'] as const).map(targetSlot => (
                                              <button
                                                key={targetSlot}
                                                type="button"
                                                onClick={() => {
                                                  const updatedScaleObj = {
                                                    ...inspectedScale,
                                                    songSlot: {
                                                      ...(inspectedScale.songSlot || {}),
                                                      [songId]: targetSlot
                                                    }
                                                  };
                                                  onUpdateScale(updatedScaleObj);
                                                  setInspectedScale(updatedScaleObj);
                                                }}
                                                className={`text-[8px] px-1.5 py-0.5 rounded capitalize font-bold transition cursor-pointer ${
                                                  slotKey === targetSlot
                                                    ? 'bg-indigo-650 text-white font-extrabold'
                                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                                }`}
                                              >
                                                {targetSlot}
                                              </button>
                                            ))}
                                          </div>
                                        )}

                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }))
                      )}

                      {/* Render any songs with unassigned slot */}
                      {inspectedScale.songIds.filter(songId => !inspectedScale.songSlot?.[songId]).length > 0 && (
                        <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-3 space-y-1.5 shadow-sm">
                          <div className="border-b border-slate-100 pb-1 mb-1">
                            <h5 className="text-[10px] font-bold uppercase text-slate-550 tracking-wider">
                              🎵 Outros Louvores Planejados
                            </h5>
                          </div>
                          <div className="space-y-2">
                            {inspectedScale.songIds.filter(songId => !inspectedScale.songSlot?.[songId]).map(songId => {
                              const sObj = songs.find(s => s.id === songId);
                              if (!sObj) return null;
                              return (
                                <div key={songId} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">{sObj.title}</span>
                                  {(currentUser.role === 'Líder' || currentUser.isAdmin) && (
                                    <div className="flex gap-1">
                                      {(['celebração', 'oferta', 'adoração'] as const).map(targetSlot => (
                                        <button
                                          key={targetSlot}
                                          type="button"
                                          onClick={() => {
                                            const updatedScaleObj = {
                                              ...inspectedScale,
                                              songSlot: {
                                                ...(inspectedScale.songSlot || {}),
                                                [songId]: targetSlot
                                              }
                                            };
                                            onUpdateScale(updatedScaleObj);
                                            setInspectedScale(updatedScaleObj);
                                          }}
                                          className="text-[8px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold cursor-pointer"
                                        >
                                          {targetSlot}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Col B: Team allocated - Separated into 1º and 2º Horário columns! (5/12 width) */}
                  <div className="md:col-span-5 space-y-3 h-full">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                      <User className="h-4 w-4 text-indigo-500" />
                      Músicos Coordenados
                    </h4>

                    {/* Team segmented list */}
                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                      
                      {/* 1º Horário */}
                      <div className="border border-slate-150 rounded-2xl p-2.5 bg-slate-50/30">
                        <div className="text-[9px] font-extrabold text-indigo-750 bg-indigo-100/60 px-2 py-0.5 rounded-md mb-2 uppercase font-mono tracking-wider w-max">
                          1º Horário
                        </div>
                        {inspectedScale.participants.filter(p => p.shift === '1' || p.shift === 'both').length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic pl-1 py-1">Nenhum integrante escalado neste turno.</div>
                        ) : (
                          <div className="space-y-1.5">
                            {inspectedScale.participants.filter(p => p.shift === '1' || p.shift === 'both').map(cell => (
                              <div key={cell.userId} className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-slate-150 shadow-xs">
                                <div className="flex items-center gap-1.5 leading-tight">
                                  <img
                                    src={cell.avatarUrl}
                                    alt={cell.name}
                                    className="h-6 w-6 rounded-md bg-slate-100 border p-0.5 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h6 className="text-[10px] font-bold text-slate-900 truncate max-w-[150px]">{cell.name}</h6>
                                    <span className="text-[8px] text-slate-500 block truncate max-w-[150px]">{cell.role}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2º Horário */}
                      <div className="border border-slate-150 rounded-2xl p-2.5 bg-slate-50/30">
                        <div className="text-[9px] font-extrabold text-indigo-750 bg-indigo-100/60 px-2 py-0.5 rounded-md mb-2 uppercase font-mono tracking-wider w-max">
                          2º Horário
                        </div>
                        {inspectedScale.participants.filter(p => p.shift === '2' || p.shift === 'both').length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic pl-1 py-1">Nenhum integrante escalado neste turno.</div>
                        ) : (
                          <div className="space-y-1.5">
                            {inspectedScale.participants.filter(p => p.shift === '2' || p.shift === 'both').map(cell => (
                              <div key={cell.userId} className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-slate-150 shadow-xs">
                                <div className="flex items-center gap-1.5 leading-tight">
                                  <img
                                    src={cell.avatarUrl}
                                    alt={cell.name}
                                    className="h-6 w-6 rounded-md bg-slate-100 border p-0.5 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h6 className="text-[10px] font-bold text-slate-900 truncate max-w-[150px]">{cell.name}</h6>
                                    <span className="text-[8px] text-slate-500 block truncate max-w-[150px]">{cell.role}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

              </div>

              {/* Personal Active User response actions inside Modal */}
              <div className="mt-5 pt-3.5 border-t border-slate-150 flex flex-col sm:flex-row gap-3.5 justify-between items-center bg-slate-50 -mx-6 -mb-6 p-5 rounded-b-3xl">
                
                <div className="text-[11px] text-slate-500 italic max-w-sm sm:max-w-md leading-normal">
                  ℹ️ Não é necessário confirmar presença por aqui. Caso de imprevisto ou impossibilidade, por favor publique uma mensagem no <strong>Mural de Recados</strong> para avisar aos líderes e permitir sua substituição imediata.
                </div>

                {/* Administrative and Export parameters */}
                {(currentUser.role === 'Líder' || currentUser.isAdmin) && (
                  <div className="flex gap-2 pt-2.5 sm:pt-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-200 flex-wrap sm:flex-nowrap shrink-0">
                    <button
                      onClick={handleExportImage}
                      disabled={isExporting}
                      className="flex-grow sm:flex-none px-3.5 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 font-bold rounded-lg text-xs cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isExporting ? (
                        <>
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                          <span>Gerando...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          <span>Exportar Imagem</span>
                        </>
                      )}
                    </button>

                    {currentUser.isAdmin && (
                      <>
                        <button
                          onClick={() => toggleScaleStatus(inspectedScale)}
                          className="flex-1 text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1"
                        >
                          {inspectedScale.status === 'published' ? 'Despublicar (Rascunho)' : 'Publicar Escala'}
                        </button>
                        
                        <button
                          onClick={() => {
                            if (confirm('Tem certeza de que deseja deletar a escala "' + inspectedScale.title + '"?')) {
                              onDeleteScale(inspectedScale.id);
                              setInspectedScale(null);
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition rounded-lg border border-red-200/50 cursor-pointer flex items-center justify-center"
                          title="Deletar escala"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Export Card for html-to-image */}
      <div 
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '600px', overflow: 'hidden' }}
      >
        <div 
          ref={exportRef}
          className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col font-sans"
          style={{ width: '600px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
            <div className="flex justify-between items-center bg-indigo-900/40 px-3 py-1 rounded-lg w-max mb-3 border border-indigo-550/20">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-indigo-200">
                {inspectedScale?.scaleType || 'Escala'}
              </span>
            </div>
            
            <h1 className="text-xl font-extrabold tracking-tight leading-snug">
              {inspectedScale?.title || 'Escala de Louvor'}
            </h1>
            
            {inspectedScale?.description && (
              <p className="text-xs text-indigo-100/95 font-medium mt-1 leading-relaxed">
                Obs: {inspectedScale.description}
              </p>
            )}

            <div className="mt-4 pt-3.5 border-t border-indigo-600/40 grid grid-cols-2 gap-4 text-xs font-medium text-indigo-105">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-300" />
                <span>{inspectedScale ? formatDateBR(inspectedScale.date) : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-300" />
                <span>{inspectedScale?.time || ''}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mt-6 space-y-6">
            {/* Setlist */}
            <div>
              <h2 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5 mb-3 border-b pb-1.5 border-slate-150">
                <Music className="h-3.5 w-3.5 text-indigo-600" />
                Setlist Planejado ({inspectedScale?.songIds.length || 0} Canções)
              </h2>

              <div className="space-y-3">
                {!inspectedScale || inspectedScale.songIds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum louvor no setlist.</p>
                ) : (
                  (['celebração', 'oferta', 'adoração'] as const).map(slotKey => {
                    const slotSongs = inspectedScale.songIds.filter(songId => inspectedScale.songSlot?.[songId] === slotKey);
                    if (slotSongs.length === 0) return null;

                    return (
                      <div key={slotKey} className="border border-indigo-50/50 bg-indigo-50/10 rounded-xl p-3 space-y-2">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-indigo-700 mb-1.5">
                          {slotKey === 'celebração' ? '⚡ CELEBRAÇÃO (Louvor Alegre)' :
                           slotKey === 'oferta' ? '🪙 OFERTA (Dízimos / Avisos)' :
                           '🙏 ADORAÇÃO (Cânticos e Ministração)'}
                        </h3>

                        <div className="space-y-1.5">
                          {slotSongs.map(songId => {
                            const sObj = songs.find(s => s.id === songId);
                            if (!sObj) return null;

                            const leadText = inspectedScale.songLeaders?.[songId];
                            const songNote = inspectedScale.songNotes?.[songId];

                            return (
                              <div key={songId} className="flex flex-col p-2 bg-white rounded-lg border border-slate-100 shadow-2xs">
                                <div className="flex justify-between items-center gap-2">
                                  <div>
                                    <span className="text-xs font-bold text-slate-900">{sObj.title}</span>
                                    <span className="text-[10px] text-slate-500 block">Autoria: {sObj.artist}</span>
                                  </div>
                                  <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                                    Tom: {sObj.tone}
                                  </span>
                                </div>
                                {leadText && (
                                  <span className="text-[9px] text-indigo-600 font-bold mt-1">
                                    Solista: <span className="underline">{leadText}</span>
                                  </span>
                                )}
                                {songNote && (
                                  <span className="text-[9px] text-slate-500 italic mt-0.5">
                                    💡 Obs: {songNote}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Musicians */}
            <div>
              <h2 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5 mb-3 border-b pb-1.5 border-slate-150">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                Equipe Escalada (Coordenados)
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* 1º Horário */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100/60 px-2 py-0.5 rounded mb-2.5 inline-block">
                    1º Horário
                  </span>
                  {!inspectedScale || inspectedScale.participants.filter(p => p.shift === '1' || p.shift === 'both').length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">Vazio</p>
                  ) : (
                    <div className="space-y-2">
                      {inspectedScale.participants.filter(p => p.shift === '1' || p.shift === 'both').map(cell => (
                        <div key={cell.userId} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-100 shadow-3xs">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black uppercase shrink-0 ${getAvatarColorClass(cell.userId)}`}>
                              {getInitials(cell.name)}
                            </div>
                            <div className="leading-tight">
                              <h6 className="text-[10px] font-extrabold text-slate-900 truncate max-w-[120px]">{cell.name}</h6>
                              <span className="text-[8px] text-slate-500 block truncate max-w-[120px]">{cell.role}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2º Horário */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100/60 px-2 py-0.5 rounded mb-2.5 inline-block">
                    2º Horário
                  </span>
                  {!inspectedScale || inspectedScale.participants.filter(p => p.shift === '2' || p.shift === 'both').length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">Vazio</p>
                  ) : (
                    <div className="space-y-2">
                      {inspectedScale.participants.filter(p => p.shift === '2' || p.shift === 'both').map(cell => (
                        <div key={cell.userId} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-100 shadow-3xs">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black uppercase shrink-0 ${getAvatarColorClass(cell.userId)}`}>
                              {getInitials(cell.name)}
                            </div>
                            <div className="leading-tight">
                              <h6 className="text-[10px] font-extrabold text-slate-900 truncate max-w-[120px]">{cell.name}</h6>
                              <span className="text-[8px] text-slate-500 block truncate max-w-[120px]">{cell.role}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Brand */}
          <div className="mt-8 pt-4 border-t border-slate-150 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
            <span>© Louvor Belvedere IEADAM 139</span>
            <span>Escala Eletrônica</span>
          </div>
        </div>
      </div>

    </div>
  );
}

const AVATAR_COLORS = [
  'bg-indigo-500 text-white',
  'bg-emerald-500 text-white',
  'bg-sky-500 text-white',
  'bg-amber-500 text-white',
  'bg-fuchsia-500 text-white',
  'bg-rose-500 text-white',
  'bg-teal-500 text-white',
];

function getAvatarColorClass(userId: string) {
  let sum = 0;
  for (let i = 0; i < userId.length; i++) {
    sum += userId.charCodeAt(i);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
