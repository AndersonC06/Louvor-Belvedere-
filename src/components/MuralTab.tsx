/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { Message, UserProfile } from '../types';
import { MessageSquare, Send, Trash2, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface MuralTabProps {
  currentUser: UserProfile;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onClearMural: () => void;
}

export default function MuralTab({
  currentUser,
  messages,
  onSendMessage,
  onClearMural
}: MuralTabProps) {
  const [typedMessage, setTypedMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    onSendMessage(typedMessage.trim());
    setTypedMessage('');
  };

  // Helper dynamic time elapsed formatter
  const formatTimeElapsed = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHours < 24) return `Há ${diffHours} h`;
      
      return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Há algum tempo';
    }
  };

  return (
    <div id="mural-tab-container" className="space-y-4 max-w-2xl mx-auto flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      
      {/* Overview stats and admin controls */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-3xl shadow-3xs">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
            <MessageSquare className="h-4 w-4 text-indigo-505" />
            Mural de Avisos Belvedere
          </h3>
          <p className="text-[10px] text-slate-500">Espaço de comunicações rápidas da banda de louvor.</p>
        </div>

        {currentUser.isAdmin && (
          <button
            onClick={() => {
              if (confirm('Deseja realmente limpar em lote todas as mensagens anteriores do Mural?')) {
                onClearMural();
              }
            }}
            className="text-[10px] py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200/50 text-red-700 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
            title="Excluir histórico"
          >
            <Trash2 className="h-3 w-3" />
            Limpar Mural
          </button>
        )}
      </div>

      {/* Main chat log log list */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-5 shadow-xs min-h-[380px] max-h-[500px] overflow-y-auto space-y-3.5 flex flex-col-reverse justify-end pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-1" />
            Nenhum aviso ativo. Envie um comunicado abaixo!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 items-start max-w-[85%] ${
                  isMe ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {/* Avatar */}
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="h-8.5 w-8.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Message Bubble wrapper */}
                <div className={`space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {/* Sender title text */}
                  <div className="flex items-center gap-1.5 justify-end flex-row-reverse">
                    <span className="text-[10px] font-bold text-slate-800">
                      {msg.senderName}
                    </span>
                    <span className="text-[8px] text-slate-400 flex items-center gap-0.5 font-mono">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTimeElapsed(msg.createdAt)}
                    </span>
                  </div>

                  {/* Text card bubble */}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed text-slate-800 shadow-3xs text-left ${
                    isMe 
                      ? 'bg-indigo-650 text-white rounded-tr-none bg-indigo-600' 
                      : 'bg-slate-50 border border-slate-100 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

      {/* Sending message input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-white p-2 border border-slate-200 rounded-2xl shadow-sm">
        <input
          type="text"
          placeholder="Digitar comunicado importante para a equipe..."
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          className="flex-1 text-xs bg-slate-50 border border-slate-150 py-2.5 px-3.5 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white"
        />
        <button
          type="submit"
          disabled={!typedMessage.trim()}
          className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
            typedMessage.trim() 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Footer guideline instructions */}
      <div className="flex gap-2 items-center text-[10px] text-slate-400 leading-normal max-w-md mx-auto p-2 text-center justify-center">
        <ShieldAlert className="h-4 w-4 text-slate-350 shrink-0" />
        <p>Lembre-se de manter posts saudáveis e de respeito edificante para honra do ministério.</p>
      </div>

    </div>
  );
}
