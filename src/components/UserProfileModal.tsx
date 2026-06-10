/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { 
  X, User, Phone, Calendar, Mail, Sparkles, Check, Music, Upload, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onSave,
  onDeleteAccount
}: UserProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [birthdate, setBirthdate] = useState(user.birthdate || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles || []);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const instruments = [
    'Ministro', 'Vocalista Principal', 'Backing Vocal', 'Violão', 
    'Guitarra', 'Teclado', 'Piano', 'Baixo', 'Bateria', 'Percussão'
  ];

  const handleRoleToggle = (roleName: string) => {
    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleName));
    } else {
      setSelectedRoles([...selectedRoles, roleName]);
    }
  };

  const generateNewAvatar = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WEBP).');
      return;
    }

    // Limit to 1.5MB to stay well within Firestore and localstorage quotas
    if (file.size > 1.5 * 1024 * 1024) {
      alert('A imagem selecionada é muito grande. Para melhor performance, escolha uma imagem de até 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.onerror = () => {
      alert('Ocorreu um erro ao carregar o arquivo da imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('O nome não pode estar vazio.');
      return;
    }

    setSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        birthdate: birthdate.trim(),
        avatarUrl,
        roles: selectedRoles.length > 0 ? selectedRoles : ['Ministro'],
      };

      await onSave(updatedProfile);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1205);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            <span className="font-sans font-bold text-sm tracking-tight">Editar Meu Perfil</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Avatar Section with Drag & Drop */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-5 bg-slate-950/40 rounded-xl border relative transition-all duration-200 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-950/15 scale-[1.015]' 
                : 'border-slate-850/60'
            }`}
          >
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="h-24 w-24 rounded-2xl bg-slate-850 border border-slate-800 p-1.5 object-cover transition duration-150 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-150 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                <Upload className="h-4.5 w-4.5 text-indigo-300" />
                <span>Escolher Foto</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 w-full justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-indigo-650/15 hover:bg-indigo-650/20 border border-indigo-900/40 text-indigo-350 text-[11px] font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Importar Foto</span>
              </button>

              <button
                type="button"
                onClick={generateNewAvatar}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-350 text-[11px] font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Gerar Aleatório</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            <p className="text-[10px] text-slate-500 mt-2.5 font-mono text-center">
              Arraste sua foto para cá ou clique em Importar. <br/>
              Limite: 1.5MB. ID: <span className="text-slate-400">{user.id}</span>
            </p>
          </div>

          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition duration-150"
                />
              </div>
            </div>

            {/* Email Field (ReadOnly account identifier) */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                E-mail de Acesso (Não alterável)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-900 select-none rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Field */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="31999999999"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition duration-150"
                  />
                </div>
              </div>

              {/* Birthday Field */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  Data de Aniversário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    placeholder="DD/MM (ex: 15/06)"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none transition duration-150"
                  />
                </div>
              </div>
            </div>

            {/* Ministry role description info-box */}
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-[11px] text-indigo-300 flex items-start gap-2">
              <span className="font-bold flex-shrink-0 mt-0.5">💡</span>
              <div>
                <span>Cargo Ministerial: <strong className="text-white capitalize">{user.role}</strong></span>
                {user.isAdmin && <strong className="text-indigo-400 block mt-0.5">🔑 Você possui privilégios de Líder (Administrador).</strong>}
              </div>
            </div>

            {/* Instruments Checkbox Selection */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                Suas funções / Instrumentos no Ministério
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-2.5 bg-slate-950/30 border border-slate-850/80 rounded-xl">
                {instruments.map((roleName) => {
                  const isChecked = selectedRoles.includes(roleName);
                  return (
                    <button
                      key={roleName}
                      type="button"
                      onClick={() => handleRoleToggle(roleName)}
                      className={`flex items-center gap-1.5 p-1.5 text-left rounded-lg text-[10.5px] cursor-pointer transition ${
                        isChecked 
                          ? 'bg-indigo-650/25 text-indigo-350 font-bold border border-indigo-850' 
                          : 'bg-slate-900/40 hover:bg-slate-850 text-slate-400 border border-slate-850/35'
                      }`}
                    >
                      <div className={`h-3 w-3 rounded flex items-center justify-center border text-[8px] ${
                        isChecked ? 'bg-indigo-650 border-indigo-500 text-white' : 'border-slate-700'
                      }`}>
                        {isChecked && <Check className="h-2 w-2" />}
                      </div>
                      <span className="truncate">{roleName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone: Excluir Conta */}
            <div className="pt-3 border-t border-slate-850/40">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-red-500 mb-2">
                Zona de Perigo
              </h4>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmDialog(true)}
                className="w-full py-2 px-3 text-left bg-red-950/10 hover:bg-red-950/25 border border-red-900/20 text-red-400 hover:text-red-350 rounded-xl text-xs font-semibold select-none flex items-center justify-between transition cursor-pointer"
              >
                <span>Excluir permanentemente minha conta</span>
                <span className="text-[10px] bg-red-900/25 px-2 py-0.5 rounded border border-red-900/30">Apagar tudo</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-transparent hover:bg-slate-805 border border-slate-850 text-slate-350 text-xs py-2.5 rounded-xl cursor-pointer font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-600 border border-indigo-500 text-white text-xs py-2.5 rounded-xl cursor-pointer font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15"
            >
              {success ? (
                <>
                  <Check className="h-4 w-4" />
                  Salvo!
                </>
              ) : saving ? (
                'Salvando...'
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>

        </form>
      </motion.div>

      {/* AlertDialog / Independent Confirmation Modal */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 selection:bg-red-500">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-950 border border-red-950/40 text-slate-100 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-950/30 border border-red-900/20 flex items-center justify-center text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm tracking-tight text-white">Excluir Conta Permanentemente?</h3>
                <p className="text-[10px] text-red-400 font-mono uppercase tracking-widest mt-0.5">Aviso de Segurança</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Você tem certeza de que deseja prosseguir? Esta ação excluirá permanentemente seu perfil de músico, dados pessoais cadastrados, preferências de função e participações de escalas do <strong>Louvor Belvedere</strong>.
            </p>

            <div className="bg-red-950/10 border border-red-900/20 p-3 rounded-2xl text-[11px] text-red-300 leading-relaxed">
              <strong>Atenção:</strong> Isso é irreversível. Para acessar o aplicativo novamente, você precisará criar uma nova conta e aguardar nova autorização da liderança.
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmDialog(false)}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs rounded-xl font-semibold cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirmDialog(false);
                  onClose();
                  await onDeleteAccount();
                }}
                className="flex-1 py-2 px-3 bg-red-650 hover:bg-red-700 text-white text-xs rounded-xl font-bold cursor-pointer transition shadow"
              >
                Sim, Excluir Conta
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
