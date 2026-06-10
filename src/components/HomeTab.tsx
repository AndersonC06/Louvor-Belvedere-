/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent, useEffect } from 'react';
import { Song, Scale, Devotional, UserProfile } from '../types';
import { 
  Users, Music, Calendar, CheckCircle, Award, BookOpen, Edit2, 
  Check, X, Search, Plus, Phone, Sparkles, AlertCircle, Info, Heart, Smile,
  Cpu, Clock, Activity, ShieldCheck, ArrowUpRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeTabProps {
  currentUser: UserProfile;
  users: UserProfile[];
  songs: Song[];
  scales: Scale[];
  devotional: Devotional;
  onUpdateDevotional: (updated: Devotional) => void;
  onAddUser: (user: UserProfile) => void;
  onResponseToScale: (scaleId: string, status: 'confirmed' | 'declined') => void;
  onUpdateUserRole: (userId: string, targetRole: 'membro' | 'cantor' | 'Líder') => void;
}

export default function HomeTab({
  currentUser,
  users,
  songs,
  scales,
  devotional,
  onUpdateDevotional,
  onAddUser,
  onResponseToScale,
  onUpdateUserRole
}: HomeTabProps) {
  // Clock state
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');

  // Add Member State
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberBirthdate, setNewMemberBirthdate] = useState('');
  const [newMemberRoles, setNewMemberRoles] = useState<string[]>([]);
  const [newMemberIsAdmin, setNewMemberIsAdmin] = useState(false);

  // Edit Devotional State
  const [showEditDevotional, setShowEditDevotional] = useState(false);
  const [devotTitle, setDevotTitle] = useState(devotional.title);
  const [devotPassage, setDevotPassage] = useState(devotional.passage);
  const [devotText, setDevotText] = useState(devotional.text);

  // Edit Help/Info State
  const [showEditHelpText, setShowEditHelpText] = useState(false);
  const [editedHelpText, setEditedHelpText] = useState(devotional.helpText || '');

  const availableRoles = [
    'Ministro', 'Vocalista Principal', 'Backing Vocal', 'Violão', 
    'Guitarra', 'Teclado', 'Piano', 'Baixo', 'Bateria', 'Percussão'
  ];

  // Calculations for stats
  const totalMembers = users.length;
  const totalSongs = songs.length;
  
  // Public scales count
  const publicScales = scales.filter(s => s.status === 'published');
  const draftScales = scales.filter(s => s.status === 'draft');
  const scaleCountText = `${publicScales.length} Públicas (${draftScales.length} rascunhos)`;

  // Overall acceptance rate for published scales
  let totalAllocations = 0;
  let totalConfirmations = 0;
  publicScales.forEach(sc => {
    sc.participants.forEach(p => {
      totalAllocations++;
      if (p.status === 'confirmed') totalConfirmations++;
    });
  });
  const rawRate = totalAllocations > 0 ? (totalConfirmations / totalAllocations) * 100 : 92;
  const confirmationRate = `${Math.round(rawRate)}% de Aceite`;

  // Filter scales for current user scheduled duties
  const myUpcomingDuties = publicScales.filter(sc => {
    // Is user signed up?
    return sc.participants.some(p => p.userId === currentUser.id);
  });

  const handleRoleToggle = (role: string) => {
    if (newMemberRoles.includes(role)) {
      setNewMemberRoles(newMemberRoles.filter(r => r !== role));
    } else {
      setNewMemberRoles([...newMemberRoles, role]);
    }
  };

  const handleAddMemberSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) {
      alert('Nome e E-mail são obrigatórios!');
      return;
    }

    const nId = 'u_' + (users.length + 1) + '_' + Math.floor(Math.random() * 100);
    const seed = newMemberName.toLowerCase().replace(/\s+/g, '-');
    const u: UserProfile = {
      id: nId,
      name: newMemberName,
      email: newMemberEmail,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
      roles: newMemberRoles.length > 0 ? newMemberRoles : ['Ministro'],
      birthdate: newMemberBirthdate || '10/06',
      role: newMemberIsAdmin ? 'Líder' : 'membro',
      isAdmin: newMemberIsAdmin,
      phone: newMemberPhone || '31999999999',
    };

    onAddUser(u);
    alert('Membro adiconado com sucesso!');
    
    // Clear
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setNewMemberBirthdate('');
    setNewMemberRoles([]);
    setNewMemberIsAdmin(false);
    setShowAddMember(false);
  };

  const submitDevotionalEdit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateDevotional({
      title: devotTitle,
      passage: devotPassage,
      text: devotText,
      lastUpdated: new Date().toISOString(),
      ...(devotional.helpText ? { helpText: devotional.helpText } : {})
    });
    setShowEditDevotional(false);
  };

  const submitHelpTextEdit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateDevotional({
      ...devotional,
      helpText: editedHelpText,
      lastUpdated: new Date().toISOString()
    });
    setShowEditHelpText(false);
  };

  // Birthdays of the current calendar month dynamically
  const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dateObj = new Date();
  const currentMonthNum = String(dateObj.getMonth() + 1).padStart(2, '0');
  const currentMonthName = monthNamesPt[dateObj.getMonth()];

  const birthdayKids = users.filter(usr => {
    if (!usr.birthdate) return false;
    const parts = usr.birthdate.split('/');
    return parts[1] === currentMonthNum || 
           usr.birthdate.endsWith('/' + currentMonthNum) || 
           usr.birthdate.endsWith('-' + currentMonthNum);
  });

  const getWhatsAppLink = (member: UserProfile) => {
    const text = `Graça e Paz, ${member.name}! Passando para parabenizar você pelo seu aniversário! Que o Senhor Jesus continue te abençoando rica e poderosamente, e que seu louvor seja sempre um incenso suave perante o trono de Deus. Forte abraço de toda a equipe Belvedere! 🎉🙌🎸`;
    return `https://api.whatsapp.com/send?phone=55${member.phone}&text=${encodeURIComponent(text)}`;
  };

  // Searching and category filtering members list
  const filteredUsers = users.filter(u => {
    const sMatch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   u.roles.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
    const rMatch = roleFilter === 'Todos' || u.roles.some(r => r.includes(roleFilter));
    return sMatch && rMatch;
  });

  return (
    <div id="home-tab-scroller" className="space-y-6 max-w-4xl mx-auto selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      
      {/* Dynamic Technological Operational Header */}
      <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-6 relative overflow-hidden shadow-2xl">
        {/* Futuristic glowing geometric absolute details */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* System Matrix Subline */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse">
              <Cpu className="h-5 w-5 text-indigo-50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                  CORE v4.0 PRO
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  SISTEMA ONLINE
                </span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Olá, {currentUser.name}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono tracking-wide mt-0.5">
                Nível de Autorização: <span className="text-indigo-300 font-bold">{currentUser.role || 'Membro Técnico'}</span>
              </p>
            </div>
          </div>

          {/* Running Clock and BRT details */}
          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-2.5 backdrop-blur-md">
            <div className="text-right">
              <span className="block text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Sincronização Ativa</span>
              <span className="block text-[15px] font-mono font-black tracking-wider text-white">
                {currentTime || '00:00:00'}
              </span>
            </div>
            <div className="p-2 bg-slate-850 rounded-lg border border-slate-750">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry stats row (with scales cards removed as requested) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-900 relative z-10">
          
          {/* Telemetry Stat 1 */}
          <div className="bg-slate-900/40 border border-slate-850/80 p-4 rounded-2xl flex items-center justify-between hover:border-slate-800 transition group">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-indigo-950/80 text-indigo-400 rounded-xl border border-indigo-900/50 group-hover:scale-105 transition">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Operadores Ativos</span>
                <span className="text-base font-bold text-slate-100 font-mono">{totalMembers} Membros Sincronizados</span>
              </div>
            </div>
            <div className="text-slate-600 hover:text-indigo-400 transition">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          {/* Telemetry Stat 2 */}
          <div className="bg-slate-900/40 border border-slate-850/80 p-4 rounded-2xl flex items-center justify-between hover:border-slate-800 transition group">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-indigo-950/80 text-indigo-400 rounded-xl border border-indigo-900/50 group-hover:scale-105 transition">
                <Music className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest">Banco Litúrgico</span>
                <span className="text-base font-bold text-slate-100 font-mono">{totalSongs} Louvores Catalogados</span>
              </div>
            </div>
            <div className="text-slate-600 hover:text-indigo-400 transition">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

        </div>
      </div>

      {/* Main Row: Duties & Devotional */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Col Left (Devotional & Members): 7/12 width */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Alignment Devotional Card */}
          <div className="bg-gradient-to-br from-slate-900/90 to-indigo-950 border border-indigo-950 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <BookOpen className="h-32 w-32 text-indigo-500" />
            </div>

            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-2 text-indigo-400">
                <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-mono font-bold">Painel de Alinhamento Coletivo</span>
              </div>
              
              {currentUser.isAdmin && (
                <button
                  onClick={() => {
                    setDevotTitle(devotional.title);
                    setDevotPassage(devotional.passage);
                    setDevotText(devotional.text);
                    setShowEditDevotional(true);
                  }}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-indigo-900/30 hover:bg-indigo-900/70 text-indigo-200 font-bold border border-indigo-800/40 font-mono transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  EDITAR ESTUDO
                </button>
              )}
            </div>

            <div className="relative z-10 space-y-3">
              <h2 className="text-base font-extrabold text-white tracking-tight leading-snug">
                {devotional.title}
              </h2>
              <div className="inline-block text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/35 px-2.5 py-1 rounded-md">
                📖 {devotional.passage}
              </div>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                {devotional.text}
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-950/50 text-[9px] text-slate-500 flex justify-between items-center font-mono">
              <span className="tracking-wide">LOUVOR BELVEDERE • INSPIRAÇÃO DIÁRIA</span>
              <span>REFLEXÃO VATIVA</span>
            </div>
          </div>

          {/* Devotional Edit Overlay Form */}
          <AnimatePresence>
            {showEditDevotional && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 selection:bg-indigo-500"
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl"
                >
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-indigo-400" />
                    Atualizar Estudo Devocional
                  </h3>
                  <form onSubmit={submitDevotionalEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Título</label>
                      <input
                        type="text"
                        value={devotTitle}
                        onChange={(e) => setDevotTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Versículo Base (Passagem)</label>
                      <input
                        type="text"
                        value={devotPassage}
                        onChange={(e) => setDevotPassage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Mensagem Reflexiva</label>
                      <textarea
                        rows={6}
                        value={devotText}
                        onChange={(e) => setDevotText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEditDevotional(false)}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs rounded-xl transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                      >
                        Salvar Devocional
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Member Catalog */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-indigo-600" />
                  Quadro de Integrantes Sincronizados
                </h3>
                <p className="text-[11px] text-slate-500">Membros técnicos e vocais cadastrados no sistema operacional</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou instrumento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-855 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Fast Pills Selector */}
              <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none items-center">
                {['Todos', 'Vocalista', 'Guitarra', 'Teclado', 'Bateria', 'Baixo'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`text-[10px] px-3 py-1.5 rounded-xl border shrink-0 font-bold tracking-wide transition cursor-pointer ${
                      (r === 'Todos' && roleFilter === 'Todos') || (r !== 'Todos' && roleFilter === r)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* List with scroll */}
            <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-mono">
                  NENHUM OPERADOR IDENTIFICADO COM ESTES PARÂMETROS
                </div>
              ) : (
                filteredUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-150/70 hover:shadow-2xs transition">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.avatarUrl} 
                        alt={item.name} 
                        className="h-9 w-9 rounded-xl bg-slate-200 border border-slate-250 p-0.5"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {item.roles.map((inst, idx) => (
                            <span key={idx} className="text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100/50 rounded-md px-1.5 py-0.5">
                              {inst}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 text-right shrink-0">
                      {/* Assign role dropdown (Líder only) or Role Tag */}
                      {currentUser.role === 'Líder' && item.id !== currentUser.id ? (
                        <select
                          value={item.role || 'membro'}
                          onChange={(e) => onUpdateUserRole?.(item.id, e.target.value as any)}
                          className="text-[10px] font-bold uppercase bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl py-1.5 px-2 cursor-pointer focus:outline-none"
                        >
                          <option value="membro">Membro</option>
                          <option value="cantor">Cantor</option>
                          <option value="Líder">Líder</option>
                        </select>
                      ) : (
                        <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                          item.role === 'Líder' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-extrabold' :
                          item.role === 'cantor' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-extrabold' :
                          'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          {item.role || 'Membro'}
                        </span>
                      )}

                      <div className="text-right font-mono">
                        <span className="block text-[9px] text-slate-500 font-bold">NIVER: {item.birthdate}</span>
                        <span className="block text-[8px] text-slate-400">{item.phone}</span>
                      </div>
                      
                      <a
                        href={`https://wa.me/55${item.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-250 text-slate-600 hover:text-emerald-700 rounded-xl transition shadow-3xs"
                        title="Enviar Mensagem WhatsApp"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Col Right: Guidelines and Birthday Celebrations */}
        <div className="md:col-span-5 space-y-6">

          {/* General Belvedere Information Block */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4.5 text-xs text-slate-650 space-y-2 relative shadow-xs hover:shadow-md transition">
            <div className="flex justify-between items-center bg-slate-50 -mx-4.5 -mt-4.5 p-3 px-4.5 rounded-t-3xl border-b border-slate-150">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Diretrizes & Protocolos</span>
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedHelpText(devotional.helpText || 'Os ensaios regulares acontecem aos sábados, às 16h00 no templo Belvedere. Se precisar de substituto, notifique a liderança no mural de recados até a terça-feira anterior.');
                    setShowEditHelpText(true);
                  }}
                  className="text-[9px] font-bold text-indigo-650 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer font-mono uppercase"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                  EDITAR DIRETRIZES
                </button>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-600">
                {devotional.helpText || 'Os ensaios regulares acontecem aos sábados, às 16h00 no templo Belvedere. Se precisar de substituto, notifique a liderança no mural de recados até a terça-feira anterior.'}
              </p>
            </div>
          </div>

          {/* Section: Anniversary list of the month */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative">
            <div className="absolute top-4 right-4 text-indigo-200">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>

            <div className="mb-3.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Heart className="h-4.5 w-4.5 text-indigo-500 fill-indigo-200" />
                Aniversariantes • {currentMonthName}
              </h3>
              <p className="text-[11px] text-slate-500">Mande um testemunho de bênção aos nossos aniversariantes!</p>
            </div>

            {birthdayKids.length === 0 ? (
              <div className="text-center py-5 text-xs text-slate-405 font-mono">
                NENHUM INSTRUMENTISTA FAZ ANIVERSÁRIO EM {currentMonthName.toUpperCase()}
              </div>
            ) : (
              <div className="space-y-2.5">
                {birthdayKids.map((kid) => (
                  <div key={kid.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/30 border border-indigo-100/30">
                    <div className="flex items-center gap-2">
                       <img 
                        src={kid.avatarUrl} 
                        alt={kid.name} 
                        className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 p-0.5"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{kid.name}</h4>
                        <span className="text-[9px] text-slate-500 font-mono">Celebração no dia: {kid.birthdate}</span>
                      </div>
                    </div>

                    <a
                      href={getWhatsAppLink(kid)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm transition"
                    >
                      <Plus className="h-3 w-3" />
                      Parabéns
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HelpText Edit Overlay Form */}
          <AnimatePresence>
            {showEditHelpText && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 selection:bg-indigo-500"
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl"
                >
                  <h3 className="text-base font-bold text-white mb-4">Editar Ajuda e Informações</h3>
                  <form onSubmit={submitHelpTextEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Dicas e Avisos do Ministério</label>
                      <textarea
                        rows={5}
                        value={editedHelpText}
                        onChange={(e) => setEditedHelpText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                        placeholder="Insira as regras, datas de ensaios ou orientações gerais da equipe..."
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                       <button
                        type="button"
                        onClick={() => setShowEditHelpText(false)}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                      >
                        Salvar Informações
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
