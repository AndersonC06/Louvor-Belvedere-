/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { Song, Scale, Devotional, UserProfile } from '../types';
import { 
  Users, Music, Calendar, CheckCircle, Award, BookOpen, Edit2, 
  Check, X, Search, Plus, Phone, Sparkles, AlertCircle, Info, Heart, Smile
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
      
      {/* Bento Stats Grid */}
      <div id="bento-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[11px] font-sans text-slate-500 uppercase tracking-wide font-medium">Equipe Ativa</span>
            <span className="text-lg font-bold text-slate-900">{totalMembers} Membros</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[11px] font-sans text-slate-500 uppercase tracking-wide font-medium">Repertório</span>
            <span className="text-lg font-bold text-slate-900">{totalSongs} Louvores</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[11px] font-sans text-slate-500 uppercase tracking-wide font-medium">Escalas Ativas</span>
            <span className="text-[13px] font-bold text-slate-900 line-clamp-1">{scaleCountText}</span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-3.5 hover:shadow-md transition">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[11px] font-sans text-slate-500 uppercase tracking-wide font-medium">Adesão Escala</span>
            <span className="text-lg font-bold text-slate-900">{confirmationRate}</span>
          </div>
        </div>
      </div>

      {/* Main Row: Duties & Devotional */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Col Left (Devotional): 7/12 width */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Alignment Devotional Card */}
          <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <BookOpen className="h-32 w-32 text-indigo-500" />
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Devocional do Ministério</span>
              </div>
              
              {currentUser.isAdmin && (
                <button
                  onClick={() => {
                    setDevotTitle(devotional.title);
                    setDevotPassage(devotional.passage);
                    setDevotText(devotional.text);
                    setShowEditDevotional(true);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/80 text-indigo-200 font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </button>
              )}
            </div>

            <h2 className="text-lg font-sans font-semibold text-white tracking-tight mb-1">
              {devotional.title}
            </h2>
            <p className="text-xs italic text-indigo-300 font-medium font-mono mb-4">
              {devotional.passage}
            </p>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
              {devotional.text}
            </p>

            <div className="mt-4 pt-3.5 border-t border-slate-900 text-[10px] text-slate-500 flex justify-between items-center font-mono">
              <span>Louvor Belvedere • Inspiração Semanal</span>
              <span>Reflexão viva</span>
            </div>
          </div>

          {/* Devotional Edit Overlay Form */}
          <AnimatePresence>
            {showEditDevotional && (
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
                  <h3 className="text-base font-semibold text-white mb-4">Atualizar Estudo Devocional</h3>
                  <form onSubmit={submitDevotionalEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Título</label>
                      <input
                        type="text"
                        value={devotTitle}
                        onChange={(e) => setDevotTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Versículo Base (Passagem)</label>
                      <input
                        type="text"
                        value={devotPassage}
                        onChange={(e) => setDevotPassage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Mensagem Reflexiva</label>
                      <textarea
                        rows={6}
                        value={devotText}
                        onChange={(e) => setDevotText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEditDevotional(false)}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
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
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Lista de Membros</h3>
                <p className="text-[11px] text-slate-500">Integrantes cadastrados na equipe da Igreja Belvedere</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou papel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Fast Pills Selector */}
              <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none">
                {['Todos', 'Vocalista', 'Guitarra', 'Teclado', 'Bateria', 'Baixo'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 font-medium transition cursor-pointer ${
                      (r === 'Todos' && roleFilter === 'Todos') || (r !== 'Todos' && roleFilter === r)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* List with scroll */}
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nenhum integrante encontrado com estes termos.
                </div>
              ) : (
                filteredUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={item.avatarUrl} 
                        alt={item.name} 
                        className="h-8.5 w-8.5 rounded-lg bg-slate-200 border border-slate-300"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-slate-900">{item.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                          {item.roles.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      {/* Assign role dropdown (Líder only) or Role Tag */}
                      {currentUser.role === 'Líder' && item.id !== currentUser.id ? (
                        <select
                          value={item.role || 'membro'}
                          onChange={(e) => onUpdateUserRole?.(item.id, e.target.value as any)}
                          className="text-[10px] font-semibold bg-slate-900 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg py-1 px-1.5 cursor-pointer focus:outline-none"
                        >
                          <option value="membro">Membro</option>
                          <option value="cantor">Cantor</option>
                          <option value="Líder">Líder</option>
                        </select>
                      ) : (
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.role === 'Líder' ? 'bg-indigo-100 text-indigo-700' :
                          item.role === 'cantor' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.role || 'Membro'}
                        </span>
                      )}

                      <div className="text-right">
                        <span className="block text-[10px] text-slate-500 font-mono">Bday: {item.birthdate}</span>
                        <span className="block text-[9px] text-slate-400 font-mono">{item.phone}</span>
                      </div>
                      
                      <a
                        href={`https://wa.me/55${item.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 transition"
                        title="Enviar Mensagem"
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

        {/* Col Right: Personal Duties Schedule & Birthdays */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Section: Your Turn Schedule */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative">
            <h3 className="text-sm font-semibold text-slate-900 mb-3.5 flex items-center gap-1.5">
              <CheckCircle className="h-4.5 w-4.5 text-indigo-500" />
              Suas Escalas Coordenadas
            </h3>

            {myUpcomingDuties.length === 0 ? (
              <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl text-center space-y-2">
                <div className="inline-flex p-2 bg-amber-50 rounded-full text-amber-500">
                  <Smile className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-amber-950">Folga merecida!</h4>
                <p className="text-[11px] text-amber-800 leading-normal max-w-xs mx-auto">
                  {currentUser.name}, você não possui nenhuma participação agendada nos próximos cultos publicados. Aproveite para descansar ou apoiar a equipe nos ensaios voluntários!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 -mt-2 mb-3">
                  Você foi designado para as seguintes agendas do Belvedere Louvor. Confirme sua presença:
                </p>

                {myUpcomingDuties.map((item) => {
                  // Find current user's allocation
                  const myAlloc = item.participants.find(p => p.userId === currentUser.id);
                  if (!myAlloc) return null;

                  return (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-200/40 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 rounded-md px-1.5 py-0.5">
                            {item.time} ({myAlloc.shift === 'both' ? '1º e 2º Culto' : `${myAlloc.shift}º Horário`})
                          </span>
                          <h4 className="text-xs font-bold text-slate-950 mt-1">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Culto em: {item.date}</p>
                        </div>

                        {/* Status Stamp */}
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          myAlloc.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          myAlloc.status === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {myAlloc.status === 'confirmed' ? 'Confirmado' :
                           myAlloc.status === 'declined' ? 'Recusado' : 'Pendente'}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-600">
                        Atuação técnica: <strong className="text-slate-800">{myAlloc.role}</strong>
                      </div>

                      {/* Confirm/Decline Immediate Actions */}
                      {myAlloc.status === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-2.5 border-t border-indigo-200/30">
                          <button
                            onClick={() => onResponseToScale(item.id, 'declined')}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-semibold py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition border border-red-200/50"
                          >
                            <X className="h-3 w-3" />
                            Recusar Turno
                          </button>
                          <button
                            onClick={() => onResponseToScale(item.id, 'confirmed')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition"
                          >
                            <Check className="h-3 w-3" />
                            Confirmar Apoio
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* General Belvedere Information Block */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4.5 text-xs text-slate-600 space-y-2 relative shadow-xs hover:shadow-md transition">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ajuda e Informações</span>
              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedHelpText(devotional.helpText || 'Os ensaios regulares acontecem aos sábados, às 16h00 no templo Belvedere. Se precisar de substituto, notifique a liderança no mural de recados até a terça-feira anterior.');
                    setShowEditHelpText(true);
                  }}
                  className="text-[10px] font-semibold text-indigo-650 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  Editar
                </button>
              )}
            </div>
            <div className="flex gap-2.5">
              <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="whitespace-pre-line text-[11px] leading-relaxed">
                {devotional.helpText || 'Os ensaios regulares acontecem aos sábados, às 16h00 no templo Belvedere. Se precisar de substituto, notifique a liderança no mural de recados até a terça-feira anterior.'}
              </p>
            </div>
          </div>

          {/* Section: Anniversary list of the month */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative">
            <div className="absolute top-4 right-4 text-indigo-200">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>

            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                <Heart className="h-4.5 w-4.5 text-indigo-500 fill-indigo-200" />
                Aniversariantes de {currentMonthName}
              </h3>
              <p className="text-[11px] text-slate-500">Mande um abraço no WhatsApp dos nossos músicos!</p>
            </div>

            {birthdayKids.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Nenhum membro faz aniversário neste mês.
              </div>
            ) : (
              <div className="space-y-2.5">
                {birthdayKids.map((kid) => (
                  <div key={kid.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/20 border border-indigo-200/10">
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
                      className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1 shadow-sm transition"
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
                  <h3 className="text-base font-semibold text-white mb-4">Editar Ajuda e Informações</h3>
                  <form onSubmit={submitHelpTextEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Dicas e Avisos do Ministério</label>
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
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
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
