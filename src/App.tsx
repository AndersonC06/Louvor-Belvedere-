/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  getSavedCurrentUserId, saveCurrentUserId, clearCurrentUserId
} from './data/dbEngine';

import { Song, Scale, Message, Devotional } from './types';
import { UserProfile, INITIAL_SONGS, INITIAL_DEVOTIONAL } from './data/initialData';

import AuthScreen from './components/AuthScreen';
import HomeTab from './components/HomeTab';
import ScalesTab from './components/ScalesTab';
import RepertoireTab from './components/RepertoireTab';
import MuralTab from './components/MuralTab';
import UserProfileModal from './components/UserProfileModal';

import { 
  Music, Sparkles, User, LogOut, ChevronDown, CheckCircle, 
  MessageSquare, Calendar, Home, BookOpen, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged, deleteUser } from 'firebase/auth';

export default function App() {
  // Application Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [localUserCache, setLocalUserCache] = useState<UserProfile | null>(null);

  // Active Tab: 'home', 'scales', 'songs', 'mural'
  const [activeTab, setActiveTab] = useState<'home' | 'scales' | 'songs' | 'mural'>('home');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 1. Listen to Auth state once on mount
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUserId(firebaseUser.uid);
        saveCurrentUserId(firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDocSnap.exists()) {
            setLocalUserCache(userDocSnap.data() as UserProfile);
          }
        } catch (err) {
          console.warn("Nao foi possivel carregar o perfil do usuario no Firebase Auth:", err);
        }
      } else {
        setCurrentUserId(null);
        clearCurrentUserId();
        setLocalUserCache(null);
      }
      setAuthLoading(false);
    });
    return () => {
      unsubscribeAuth();
    };
  }, []);

  // 2. Listen to Real-Time Data from Firestore when authenticated
  useEffect(() => {
    if (!currentUserId) {
      setUsers([]);
      setSongs([]);
      setScales([]);
      setMessages([]);
      setDevotional(null);
      return;
    }

    // Listen to users collection
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });

      // Filter local generic users
      const GENT_USER_NAMES = ["anderson", "debora souza", "débora souza", "mateus lima", "lucas ferreira", "sarah mendes", "tiago rocha", "rebeca dias"];
      const GENT_USER_EMAILS = ["anderson@belvedere.com", "debora@belvedere.com", "mateus@belvedere.com", "lucas@belvedere.com", "sarah@belvedere.com", "tiago@belvedere.com", "rebeca@belvedere.com"];
      
      const cleanUsers = usersList.filter(u => {
        // Nunca filtra o usuario autenticado ativo
        if (currentUserId && u.id === currentUserId) return true;
        
        const nameLower = u.name.trim().toLowerCase();
        const emailLower = u.email.trim().toLowerCase();
        const isGeneric = GENT_USER_NAMES.includes(nameLower) || 
                          GENT_USER_EMAILS.includes(emailLower) ||
                          u.phone === '31988887777' ||
                          emailLower.endsWith('@belvedere.com');
        return !isGeneric;
      });

      setUsers(cleanUsers);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Listen to songs collection with auto-seeding
    const unsubscribeSongs = onSnapshot(collection(db, 'songs'), (snapshot) => {
      const songsList: Song[] = [];
      snapshot.forEach((doc) => {
        songsList.push(doc.data() as Song);
      });

      // Seeding in background if empty
      if (snapshot.empty && INITIAL_SONGS.length > 0 && auth.currentUser) {
        INITIAL_SONGS.forEach(async (song) => {
          try {
            await setDoc(doc(db, 'songs', song.id), song);
          } catch (e) {
            console.warn("Could not seed song:", song.title, e);
          }
        });
      }

      setSongs(songsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'songs');
    });

    // Listen to scales collection
    const unsubscribeScales = onSnapshot(collection(db, 'scales'), (snapshot) => {
      const scalesList: Scale[] = [];
      snapshot.forEach((doc) => {
        scalesList.push(doc.data() as Scale);
      });
      setScales(scalesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scales');
    });

    // Listen to messages collection
    const unsubscribeMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const messagesList: Message[] = [];
      snapshot.forEach((doc) => {
        messagesList.push(doc.data() as Message);
      });
      setMessages(messagesList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    // Listen to devotionals collection
    const unsubscribeDevotional = onSnapshot(doc(db, 'devotionals', 'default'), (docSnap) => {
      if (docSnap.exists()) {
        setDevotional(docSnap.data() as Devotional);
      } else {
        const defaultDevot = INITIAL_DEVOTIONAL;
        if (auth.currentUser) {
          setDoc(doc(db, 'devotionals', 'default'), defaultDevot).catch(err => {
            console.warn("Could not set default devotional:", err);
          });
        }
        setDevotional(defaultDevot);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'devotionals/default');
    });

    return () => {
      unsubscribeUsers();
      unsubscribeSongs();
      unsubscribeScales();
      unsubscribeMessages();
      unsubscribeDevotional();
    };
  }, [currentUserId]);

  const activeUser = users.find(u => u.id === currentUserId) || localUserCache;

  // Auth Operations
  const handleSelectUser = (id: string, user?: UserProfile) => {
    if (user) {
      setLocalUserCache(user);
    }
    setCurrentUserId(id);
    saveCurrentUserId(id);
    setShowProfileDropdown(false);
  };

  const handleRegisterUser = async (newProfile: Omit<UserProfile, 'id'>) => {
    // Legacy registry, AuthScreen creates auth & doc profile itself
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
    setCurrentUserId(null);
    clearCurrentUserId();
    setLocalUserCache(null);
    setActiveTab('home');
  };

  const handleDeleteAccount = async () => {
    if (!currentUserId) return;
    try {
      // 1. Delete user document from Firestore users collection
      await deleteDoc(doc(db, 'users', currentUserId));
      
      // 2. Clean up local states before auth triggers
      setShowProfileModal(false);
      const userToDelete = auth.currentUser;
      
      setCurrentUserId(null);
      clearCurrentUserId();
      setLocalUserCache(null);
      setActiveTab('home');

      // 3. Delete from Firebase Authentication
      if (userToDelete) {
        try {
          await deleteUser(userToDelete);
        } catch (authErr: any) {
          console.warn("Could not delete Auth user directly (requires recent login), signing out instead:", authErr);
          await signOut(auth);
        }
      }
      alert("Sua conta e perfil foram permanentemente excluídos!");
    } catch (err: any) {
      console.error("Erro ao excluir conta:", err);
      alert("Ocorreu um erro ao excluir sua conta do banco de dados.");
    }
  };

  // State mutation wrappers with direct Firestore updates
  const handleAddSong = async (newSong: Song) => {
    try {
      await setDoc(doc(db, 'songs', newSong.id), newSong);
    } catch (err: any) {
      console.error("Erro ao adicionar música no Firestore:", err);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      await deleteDoc(doc(db, 'songs', songId));
    } catch (err: any) {
      console.error("Erro ao excluir música no Firestore:", err);
    }
  };

  const handleAddScale = async (newScale: Scale) => {
    try {
      await setDoc(doc(db, 'scales', newScale.id), newScale);
    } catch (err: any) {
      console.error("Erro ao adicionar escala no Firestore:", err);
    }
  };

  const handleUpdateScale = async (updatedScale: Scale) => {
    try {
      await setDoc(doc(db, 'scales', updatedScale.id), updatedScale, { merge: true });
    } catch (err: any) {
      console.error("Erro ao atualizar escala no Firestore:", err);
    }
  };

  const handleDeleteScale = async (scaleId: string) => {
    try {
      await deleteDoc(doc(db, 'scales', scaleId));
    } catch (err: any) {
      console.error("Erro ao excluir escala no Firestore:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeUser) return;
    const msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const nMsg: Message = {
      id: msgId,
      senderId: activeUser.id,
      senderName: activeUser.name + (activeUser.isAdmin ? ' (Líder)' : ''),
      senderAvatar: activeUser.avatarUrl,
      text,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'messages', msgId), nMsg);
    } catch (err: any) {
      console.error("Erro ao enviar mensagem no Firestore:", err);
    }
  };

  const handleClearMural = async () => {
    try {
      if (messages.length === 0) return;
      for (const msg of messages) {
        await deleteDoc(doc(db, 'messages', msg.id));
      }
      alert("Mural de avisos foi limpo com sucesso!");
    } catch (err: any) {
      console.error("Erro ao limpar mural no Firestore:", err);
      alert("Erro ao limpar o mural de avisos: " + (err.message || err));
    }
  };

  const handleUpdateDevotional = async (updatedDevot: Devotional) => {
    try {
      await setDoc(doc(db, 'devotionals', 'default'), updatedDevot, { merge: true });
    } catch (err: any) {
      console.error("Erro ao atualizar devocional no Firestore:", err);
    }
  };

  const handleAddUserFromHome = async (newUser: UserProfile) => {
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err: any) {
      console.error("Erro ao adicionar usuário no Firestore:", err);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'membro' | 'cantor' | 'Líder') => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    const updatedUser = { 
      ...userToUpdate, 
      role: newRole,
      isAdmin: newRole === 'Líder'
    };
    try {
      await setDoc(doc(db, 'users', userId), updatedUser, { merge: true });
    } catch (err: any) {
      console.error("Erro ao atualizar cargo no Firestore:", err);
    }
  };

  const handleRegisterSuccess = (user: UserProfile) => {
    setLocalUserCache(user);
    setCurrentUserId(user.id);
    saveCurrentUserId(user.id);
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    try {
      const userRef = doc(db, 'users', updatedProfile.id);
      await setDoc(userRef, updatedProfile, { merge: true });
      setLocalUserCache(updatedProfile);
    } catch (err: any) {
      console.error("Erro ao atualizar perfil no Firestore:", err);
    }
  };

  // Handles confirmation/declination from Home screen or any list
  const handleResponseToScale = async (scaleId: string, status: 'confirmed' | 'declined') => {
    if (!activeUser) return;
    const targetScale = scales.find(sc => sc.id === scaleId);
    if (!targetScale) return;

    const updatedParticipants = targetScale.participants.map(part => {
      if (part.userId === activeUser.id) {
        return { ...part, status };
      }
      return part;
    });

    const updatedScale = { ...targetScale, participants: updatedParticipants };
    try {
      await setDoc(doc(db, 'scales', scaleId), updatedScale, { merge: true });
    } catch (err: any) {
      console.error("Erro ao responder escala no Firestore:", err);
    }
  };

  // Render centered spinner during authenticating init state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-sans font-bold shadow-lg shadow-indigo-600/35 relative">
            <span className="absolute inset-0 bg-indigo-600 rounded-2xl animate-ping opacity-25"></span>
            <Music className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-bold text-slate-100 tracking-tight">Louvor Belvedere</h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Sincronizando banco de dados real...</p>
          </div>
          <Loader2 className="h-4 w-4 text-indigo-400 animate-spin mt-2 animate-duration-1000" />
        </motion.div>
      </div>
    );
  }

  // If no user is authenticated, redirect to Auth Screen
  if (!currentUserId || !activeUser) {
    return (
      <AuthScreen 
        onSelectUser={handleSelectUser} 
        onRegisterSuccess={handleRegisterSuccess} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-800 text-white z-40 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center relative">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-sans font-bold shadow-md shadow-indigo-600/25">
              <Music className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="block text-[13px] font-sans font-bold tracking-tight text-white">Louvor Belvedere</span>
              <span className="block text-[9px] text-slate-400 font-mono -mt-0.5">Igreja Belvedere</span>
            </div>
          </div>

          {/* Profile Switcher & Edit Button */}
          <div className="flex items-center gap-2">
            
            {/* Main active Profile Tag */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileModal(true)}
                title="Editar meu Perfil"
                className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl py-1 px-3 text-xs font-semibold select-none cursor-pointer text-slate-100 transition"
              >
                <img 
                  src={activeUser.avatarUrl} 
                  alt={activeUser.name} 
                  className="h-6 w-6 rounded-md bg-slate-750 p-0.5"
                  referrerPolicy="no-referrer"
                />
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{activeUser.name}</span>
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-850 hover:bg-red-950/40 hover:text-red-400 border border-slate-800 rounded-xl text-slate-400 transition cursor-pointer"
              title="Trocar/Sair do Perfil"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>

          </div>

        </div>
      </header>

      {/* Main Tab content workspace */}
      <main className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto overflow-y-auto">
        
        {/* Render Tab based on active state */}
        <div id="tab-content-loader" className="pb-16 md:pb-6">
          {activeTab === 'home' && devotional && (
            <HomeTab
              currentUser={activeUser}
              users={users}
              songs={songs}
              scales={scales}
              devotional={devotional}
              onUpdateDevotional={handleUpdateDevotional}
              onAddUser={handleAddUserFromHome}
              onResponseToScale={handleResponseToScale}
              onUpdateUserRole={handleUpdateUserRole}
            />
          )}

          {activeTab === 'scales' && (
            <ScalesTab
              currentUser={activeUser}
              scales={scales}
              songs={songs}
              users={users}
              onAddScale={handleAddScale}
              onUpdateScale={handleUpdateScale}
              onDeleteScale={handleDeleteScale}
            />
          )}

          {activeTab === 'songs' && (
            <RepertoireTab
              currentUser={activeUser}
              songs={songs}
              onAddSong={handleAddSong}
              onDeleteSong={handleDeleteSong}
            />
          )}

          {activeTab === 'mural' && (
            <MuralTab
              currentUser={activeUser}
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearMural={handleClearMural}
            />
          )}
        </div>

      </main>

      {/* Floating Bottom Navigation Menu bar (Tailwind mobile first) */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl p-1.5 shadow-xl flex justify-around items-center z-40 text-slate-100">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'home' 
              ? 'bg-indigo-600 text-white font-bold' 
              : 'text-slate-400 hover:text-slate-205'
          }`}
        >
          <Home className="h-4 w-4" />
          <span className="text-[9px] mt-0.5 tracking-tight">Início</span>
        </button>

        {/* Tab 2: Scales */}
        <button
          onClick={() => setActiveTab('scales')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'scales' 
              ? 'bg-indigo-600 text-white font-bold' 
              : 'text-slate-400 hover:text-slate-205'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[9px] mt-0.5 tracking-tight">Escalas</span>
        </button>

        {/* Tab 3: Repertoire */}
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'songs' 
              ? 'bg-indigo-600 text-white font-bold' 
              : 'text-slate-400 hover:text-slate-205'
          }`}
        >
          <Music className="h-4 w-4" />
          <span className="text-[9px] mt-0.5 tracking-tight">Músicas</span>
        </button>

        {/* Tab 4: Mural */}
        <button
          onClick={() => setActiveTab('mural')}
          className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition cursor-pointer shrink-0 ${
            activeTab === 'mural' 
              ? 'bg-indigo-600 text-white font-bold' 
              : 'text-slate-400 hover:text-slate-205'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-[9px] mt-0.5 tracking-tight">Mural</span>
        </button>

      </nav>

      {/* User Profile Edit Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={activeUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={handleUpdateProfile}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

    </div>
  );
}
