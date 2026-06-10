/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent, useRef } from 'react';
import { UserProfile } from '../types';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { User, Music, Sparkles, Mail, Lock, Phone, Calendar, ArrowRight, Camera, CheckSquare, Square, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthScreenProps {
  onSelectUser: (userId: string) => void;
  onRegisterSuccess: (user: UserProfile) => void;
}

export default function AuthScreen({ onSelectUser, onRegisterSuccess }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthNotAllowed, setIsAuthNotAllowed] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [avatarBase64, setAvatarBase64] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableRoles = [
    'Ministro/Líder de Louvor', 'Vocalista Principal', 'Backing Vocal',
    'Violão', 'Guitarra', 'Teclado', 'Piano', 'Baixo', 'Bateria', 'Percussão'
  ];

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Convert and crop/downscale image on-the-fly via canvas
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        // Crop to square and scale
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_WIDTH, MAX_HEIGHT);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setAvatarBase64(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsAuthNotAllowed(false);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const uid = user.uid;
      
      // Check if profile exists in Firestore
      const userDocRef = doc(db, 'users', uid);
      let userDocSnap;
      try {
        userDocSnap = await getDoc(userDocRef);
      } catch (err: any) {
        if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
          handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        }
        throw err;
      }
      
      if (userDocSnap.exists()) {
        const existingProfile = userDocSnap.data() as UserProfile;
        onSelectUser(uid);
        onRegisterSuccess(existingProfile);
      } else {
        // If it doesn't exist, create a profile on-the-fly
        let assignedRole: 'membro' | 'cantor' | 'Líder' = 'membro';
        let mustBeAdmin = false;

        const emailVal = user.email || '';

        if (emailVal.toLowerCase() === 'andersinho06@gmail.com') {
          assignedRole = 'Líder';
          mustBeAdmin = true;
        } else {
          let usersSnapshot;
          try {
            usersSnapshot = await getDocs(query(collection(db, 'users'), limit(1)));
          } catch (err: any) {
            if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
              handleFirestoreError(err, OperationType.LIST, 'users');
            }
            throw err;
          }
          if (usersSnapshot.empty) {
            assignedRole = 'Líder';
            mustBeAdmin = true;
          }
        }

        const finalAvatar = user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(user.displayName || 'membro').replace(/\s+/g, '-')}`;

        const newProfile: UserProfile = {
          id: uid,
          name: user.displayName || 'Novo Integrante',
          email: emailVal.toLowerCase(),
          phone: user.phoneNumber || 'Sem celular',
          birthdate: '10/06',
          avatarUrl: finalAvatar,
          roles: ['Ministro'],
          role: assignedRole,
          isAdmin: mustBeAdmin,
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(userDocRef, newProfile);
        } catch (err: any) {
          if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
            handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
          }
          throw err;
        }
        onSelectUser(uid);
        onRegisterSuccess(newProfile);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsAuthNotAllowed(true);
        setErrorMsg('O provedor de login com Google está desativado no Firebase. Ative-o em seu console do Firebase.');
      } else {
        setErrorMsg('Erro de login com Google: ' + (err.message || 'tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Preencha seu e-mail e senha.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setIsAuthNotAllowed(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Parent App component listens to onAuthStateChanged and updates state, but we callback just in case
      onSelectUser(userCredential.user.uid);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Endereço de e-mail inválido.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setIsAuthNotAllowed(true);
        setErrorMsg('O provedor de autenticação "E-mail/Senha" está desativado no Firebase. Por favor, ative-o no console do Firebase (Seção Auth > Sign-in Method > E-mail/Senha) ou entre com o Google clicando no botão abaixo.');
      } else {
        setErrorMsg('Erro de login: ' + (err.message || 'tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Preencha os campos obrigatórios (*).');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setIsAuthNotAllowed(false);

    try {
      // 1. Create client-side Auth record
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = credential.user.uid;

      // 2. Check if this is the very first registered user in Firestore to grant Líder role
      let assignedRole: 'membro' | 'cantor' | 'Líder' = 'membro';
      let mustBeAdmin = false;

      // Auto-assign Líder for the primary team owner or first registrant
      if (email.trim().toLowerCase() === 'andersinho06@gmail.com') {
        assignedRole = 'Líder';
        mustBeAdmin = true;
      } else {
        let usersSnapshot;
        try {
          usersSnapshot = await getDocs(query(collection(db, 'users'), limit(1)));
        } catch (err: any) {
          if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
            handleFirestoreError(err, OperationType.LIST, 'users');
          }
          throw err;
        }
        if (usersSnapshot.empty) {
          assignedRole = 'Líder';
          mustBeAdmin = true;
        }
      }

      // Default avatar if none provided
      const finalAvatar = avatarBase64 || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '-')}`;

      // 3. Create profile document in Firestore
      const newProfile: UserProfile = {
        id: uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || 'Sem celular',
        birthdate: birthdate.trim() || '10/06',
        avatarUrl: finalAvatar,
        roles: selectedRoles.length > 0 ? selectedRoles : ['Ministro'],
        role: assignedRole,
        isAdmin: mustBeAdmin,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', uid), newProfile);
      } catch (err: any) {
        if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
        }
        throw err;
      }
      onRegisterSuccess(newProfile);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está sendo utilizado por outro membro.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha escolhida é muito fraca.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setIsAuthNotAllowed(true);
        setErrorMsg('O cadastro/autenticação por "E-mail/Senha" está desativado no Firebase. Ative-o no painel do Firebase (Autenticação > Sign-in Method > E-mail/Senha) ou use o "Entrar com Google" na tela de Login.');
      } else {
        setErrorMsg('Erro no cadastro: ' + (err.message || 'verifique sua rede.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative">
      {/* Decorative radial lighting background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-955 to-slate-950 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Sparkles className="h-28 w-28 text-indigo-400" />
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-550/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
            <Music className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-sans tracking-tight text-white font-bold">
            Louvor Belvedere
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Sistema ministerial e escalas de ensaios e cultos.
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-2xl bg-red-950/60 border border-red-800/50 text-slate-100 text-xs flex flex-col gap-3 shadow-xl"
          >
            <div className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0 text-red-400 mt-0.5 text-base">⚠️</span>
              <div className="flex-1">
                <p className="font-bold text-red-300 text-sm mb-1">Ação Necessária no Firebase</p>
                <p className="text-slate-300 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            {isAuthNotAllowed && (
              <div className="border-t border-red-900/40 pt-3 mt-1 space-y-3">
                <p className="font-semibold text-[11px] text-amber-400 uppercase tracking-wider">Como corrigir isso:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] pl-1 leading-relaxed">
                  <li>
                    Acesse o painel do seu projeto no Firebase tocando no botão abaixo.
                  </li>
                  <li>
                    No menu lateral esquerdo, vá em <strong className="text-white">Build (Construção) &gt; Authentication</strong>.
                  </li>
                  <li>
                    Clique na aba <strong className="text-white">Sign-in method</strong> (Método de login) e depois em <strong className="text-white">Add new provider</strong> (Adicionar novo provedor).
                  </li>
                  <li>
                    Selecione <strong className="text-white">E-mail/Senha</strong> (Email/Password), mude o status para <strong className="text-white">Ativado (Enabled)</strong> e clique em <strong className="text-white">Salvar</strong>.
                  </li>
                  <li>
                    Clique novamente para adicionar provedor, selecione <strong className="text-white">Google</strong>, mude para <strong className="text-white">Ativado (Enabled)</strong>, configure o e-mail de suporte (se solicitar) e clique em <strong className="text-white">Salvar</strong>.
                  </li>
                  <li>
                    Pronto! Atualize esta página e crie sua conta ou faça login de forma segura.
                  </li>
                </ol>

                <a 
                  href="https://console.firebase.google.com/project/gen-lang-client-0493930234/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 bg-red-700 hover:bg-red-650 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl transition duration-150 shadow-md border border-red-850"
                >
                  Abrir Configuração do Firebase 🚀
                </a>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!isRegistering ? (
            /* ================= LOGIN MODE ================= */
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLoginSubmit} 
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Entrar no aplicativo
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setErrorMsg(null);
                    setIsAuthNotAllowed(false);
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
                >
                  Criar conta de Membro
                </button>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-350 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="Ex: anderson@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-350 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2 transition duration-150"
              >
                {loading ? 'Entrando...' : 'Entrar com E-mail e Senha'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-2 text-slate-400 text-[10px] uppercase tracking-wider">ou utilize</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition duration-150"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.19 15.438 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.83 11.57-11.604 0-.78-.08-1.378-.2-1.926H12.24z"
                  />
                </svg>
                Entrar com Google (Recomendado)
              </button>

              <div className="pt-4 text-center">
                <span className="text-[10px] text-slate-500 inline-block px-1">
                  💡 Os líderes e cantores usam o mesmo acesso com seus e-mails individuais cadastrados.
                </span>
              </div>
            </motion.form>
          ) : (
            /* ================= REGISTER MODE ================= */
            <motion.form 
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleRegisterSubmit} 
              className="space-y-4 max-h-[580px] overflow-y-auto pr-1"
            >
              <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-450">
                  Cadastro de Integrante
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setErrorMsg(null);
                    setIsAuthNotAllowed(false);
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Voltar para Login
                </button>
              </div>

              {/* Avatar Selector row */}
              <div className="flex flex-col items-center justify-center py-2 bg-slate-950/30 rounded-2xl border border-slate-800/40 p-3 mb-1 text-center">
                <div className="relative group">
                  <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-indigo-550 flex items-center justify-center overflow-hidden">
                    {avatarBase64 ? (
                      <img 
                        src={avatarBase64} 
                        alt="Photo Avatar preview" 
                        className="h-full w-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full border border-slate-900 transition shadow-md cursor-pointer"
                    title="Importar Foto do Celular"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 cursor-pointer hover:text-indigo-400" onClick={() => fileInputRef.current?.click()}>
                  Importar foto do celular
                </span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-medium text-slate-350 mb-1">
                  Nome Completo <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-medium text-slate-350 mb-1">
                  E-mail <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-medium text-slate-350 mb-1">
                  Senha (mínimo 6 dígitos) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Escolha uma senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Phone & Birthday Line */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-350 mb-1">
                    WhatsApp (Celular)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="Ex: 31988887777"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-350 mb-1">
                    Aniversário <span className="text-[10px] text-slate-400">(Dia/Mês)</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ex: 12/10"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Atuação Roles Checklist */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Atuação / Instrumentos <span className="text-slate-400">(Selecione quais executa)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                  {availableRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggle(role)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1 cursor-pointer transition ${
                          isSelected 
                            ? 'bg-indigo-650 border-indigo-500 text-white font-medium' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3 text-slate-600" />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informative banner about first registrar */}
              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-[10px] text-slate-400 flex gap-2">
                <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>
                  O cadastro inicial concede privilégios de <strong>membro</strong>. Se você for o primeiro membro a se cadastrar ou se cadastrar com o e-mail do Líder, você será automaticamente configurado como <strong>Líder Coordenador</strong>.
                </span>
              </div>

              {/* Register Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsRegistering(false)}
                  className="w-1/3 bg-slate-950 border border-slate-800 text-slate-350 text-xs py-2.5 rounded-xl hover:bg-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition duration-150"
                >
                  <CheckCircle className="h-4 w-4" />
                  {loading ? 'Criando Conta...' : 'Cadastrar Membro'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
