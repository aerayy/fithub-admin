import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  api,
  getCoachConversations,
  getConversationMessages,
  postConversationMessage,
  markMessageRead,
  getActiveStudents,
  createCoachConversation,
  getApiBaseUrl,
  uploadImage,
} from "../lib/api";
import useWebSocket from "../hooks/useWebSocket";

function formatMessageTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isYesterday) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function formatDateSeparator(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "Bugün, " + d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Dün";
  return d.toLocaleDateString("tr-TR", { weekday: "short", month: "short", day: "numeric" });
}

const AVATAR_PLACEHOLDER = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sendBody, setSendBody] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [activeStudents, setActiveStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sendError, setSendError] = useState(null);
  const [typingMap, setTypingMap] = useState({}); // { conversation_id: timeout }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);
  const messagesEndRef = useRef(null);
  const selectedIdRef = useRef(selectedId);
  const fileInputRef = useRef(null);
  selectedIdRef.current = selectedId;

  // ---- WebSocket ----
  const handleWsMessage = useCallback((data) => {
    if (data.type === "new_message") {
      const msg = data.message;
      const convId = data.conversation_id;
      // Add to current chat if viewing this conversation
      if (convId === selectedIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                last_message_preview: msg.message_type === "image" ? "[Foto]" : msg.body,
                last_message_at: msg.created_at,
                unread_count: convId === selectedIdRef.current ? c.unread_count : (c.unread_count || 0) + 1,
              }
            : c
        )
      );
      // Auto-mark read if viewing this conversation and message is from client
      if (convId === selectedIdRef.current && msg.sender_type === "client" && !msg.read_at) {
        markMessageRead(convId, msg.id).catch(() => {});
      }
    } else if (data.type === "typing") {
      const convId = data.conversation_id;
      setTypingMap((prev) => {
        clearTimeout(prev[convId]);
        const timeout = setTimeout(() => {
          setTypingMap((p) => {
            const next = { ...p };
            delete next[convId];
            return next;
          });
        }, 3000);
        return { ...prev, [convId]: timeout };
      });
    } else if (data.type === "message_read") {
      const { conversation_id, message_id } = data;
      if (conversation_id === selectedIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message_id ? { ...m, read_at: new Date().toISOString() } : m
          )
        );
      }
    }
  }, []);

  const { connected: wsConnected, sendMessage: wsSend } = useWebSocket({
    onMessage: handleWsMessage,
  });

  const selected = conversations.find((c) => c.id === selectedId);
  const chatTarget = selected || (selectedStudent && {
    client_name: selectedStudent.full_name || selectedStudent.name || selectedStudent.email || "Öğrenci",
    client_avatar: selectedStudent.avatar,
    client_user_id: studentIdInConv(selectedStudent),
  });
  function studentIdInConv(s) { return s?.id ?? s?.user_id ?? s?.student_id; }

  // Fetch student detail + active programs for right panel
  const clientUserId = chatTarget?.client_user_id;
  useEffect(() => {
    if (!clientUserId) { setStudentDetail(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const [detailRes, progRes] = await Promise.allSettled([
          api.get(`/admin/students/${clientUserId}`),
          api.get(`/coach/students/${clientUserId}/active-programs`),
        ]);
        if (cancelled) return;
        const detail = detailRes.status === "fulfilled" ? detailRes.value.data : null;
        const progs = progRes.status === "fulfilled" ? progRes.value.data : null;
        setStudentDetail({ ...detail, _programs: progs });
      } catch { if (!cancelled) setStudentDetail(null); }
    })();
    return () => { cancelled = true; };
  }, [clientUserId]);

  const GOAL_TR = { gain_muscle: "Kas Geliştir", lose_weight: "Kilo Ver", get_toned: "Sıkılaş", stay_fit: "Fit Kal" };
  const studentGoal = studentDetail?.onboarding?.your_goal || studentDetail?.student?.goal_type || "";
  const studentWeight = studentDetail?.onboarding?.weight_kg || studentDetail?.student?.weight_kg;
  const studentHeight = studentDetail?.onboarding?.height_cm || studentDetail?.student?.height_cm;
  const hasWorkout = !!studentDetail?._programs?.workout_program;
  const hasNutrition = !!studentDetail?._programs?.nutrition_program;

  const fetchActiveStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const list = await getActiveStudents();
      setActiveStudents(list);
    } catch (e) {
      console.error("Active students fetch error:", e?.response?.data);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveStudents();
  }, [fetchActiveStudents]);

  const fetchConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await getCoachConversations();
      setConversations(list);

      // Auto-select from URL param ?conversation=ID
      const urlConvId = searchParams.get("conversation");
      if (urlConvId) {
        const numId = Number(urlConvId);
        if (list.some((c) => c.id === numId)) {
          setSelectedId(numId);
          setSearchParams({}, { replace: true }); // clean URL
          return list;
        }
      }

      if (list.length && !selectedId) setSelectedId(list[0].id);
      return list;
    } catch (e) {
      console.error("Conversations fetch error:", e?.response?.data);
      return [];
    } finally {
      setLoadingList(false);
    }
  }, [selectedId, searchParams, setSearchParams]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchMessages = useCallback(async (conversationId, before = null) => {
    if (!conversationId) return;
    if (before) setLoadingMore(true);
    else setLoadingMessages(true);
    try {
      const { messages: next, has_more } = await getConversationMessages(conversationId, {
        limit: 50,
        before: before || undefined,
      });
      if (before) {
        setMessages((prev) => [...next, ...prev]);
      } else {
        setMessages(next);
      }
      setHasMore(!!has_more);
    } catch (e) {
      console.error("Messages fetch error:", e?.response?.data);
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setHasMore(false);
      return;
    }
    fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const markClientMessagesRead = useCallback(async () => {
    if (!selectedId) return;
    const clientMessages = messages.filter((m) => m.sender_type === "client" && !m.read_at);
    for (const m of clientMessages) {
      try {
        if (wsConnected) {
          wsSend({ type: "read", conversation_id: selectedId, message_id: m.id });
        } else {
          await markMessageRead(selectedId, m.id);
        }
      } catch (_) {}
    }
    if (clientMessages.length) {
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, unread_count: 0 } : c))
      );
    }
  }, [selectedId, messages, wsConnected, wsSend]);

  useEffect(() => {
    if (!selectedId || !messages.length) return;
    markClientMessagesRead();
  }, [selectedId, messages.length, markClientMessagesRead]);

  const loadOlder = () => {
    const oldest = messages[messages.length - 1];
    if (!oldest || !hasMore || loadingMore) return;
    fetchMessages(selectedId, oldest.id);
  };

  // ---- Send text/image message ----
  const sendMessage = async ({ imageData } = {}) => {
    const body = (sendBody || "").trim();
    if (!body && !imageData) return;
    setSendError(null);

    let conversationId = selectedId;
    if (!conversationId && selectedStudent) {
      const uid = studentIdInConv(selectedStudent);
      if (!uid) {
        setSendError("Öğrenci bilgisi eksik.");
        return;
      }
      setSending(true);
      try {
        const created = await createCoachConversation(uid);
        conversationId = created?.id ?? created?.conversation_id;
        if (!conversationId) {
          const list = await getCoachConversations();
          const found = (list || []).find((c) => String(c.client_user_id) === String(uid));
          conversationId = found?.id;
        }
        if (conversationId) {
          setSelectedId(conversationId);
          setSelectedStudent(null);
          await fetchConversations();
        }
      } catch (e) {
        const msg = e?.message === "Network Error"
          ? `Bağlantı hatası. ${getApiBaseUrl()}`
          : (e?.response?.data?.detail ?? e?.message ?? "Konuşma oluşturulamadı.");
        setSendError(msg);
        setSending(false);
        return;
      }
    }

    if (!conversationId) {
      setSendError("Konuşma açılamadı.");
      setSending(false);
      return;
    }

    setSending(true);
    try {
      if (wsConnected) {
        // Send via WebSocket
        wsSend({
          type: "message",
          conversation_id: conversationId,
          body: imageData ? (body || null) : body,
          message_type: imageData ? "image" : "text",
          media_url: imageData?.url || null,
          media_metadata: imageData ? { width: imageData.width, height: imageData.height, size_bytes: imageData.size_bytes } : null,
        });
        setSendBody("");
      } else {
        // Fallback to REST
        const sent = await postConversationMessage(conversationId, imageData ? (body || null) : body, {
          message_type: imageData ? "image" : "text",
          media_url: imageData?.url,
          media_metadata: imageData ? { width: imageData.width, height: imageData.height } : undefined,
        });
        setSendBody("");
        setMessages((prev) => [...prev, sent]);
        fetchConversations();
      }
    } catch (e) {
      const msg = e?.message === "Network Error"
        ? `Bağlantı hatası. ${getApiBaseUrl()}`
        : (e?.response?.data?.detail ?? e?.message ?? "Mesaj gönderilemedi.");
      setSendError(msg);
    } finally {
      setSending(false);
    }
  };

  // ---- Image upload ----
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploadingImage(true);
    setSendError(null);
    try {
      const data = await uploadImage(file);
      await sendMessage({ imageData: data });
    } catch (err) {
      setSendError(err?.response?.data?.detail ?? err?.message ?? "Fotoğraf yüklenemedi.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ---- Typing indicator ----
  const typingTimeout = useRef(null);
  const handleTyping = () => {
    if (!wsConnected || !selectedId) return;
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      wsSend({ type: "typing", conversation_id: selectedId });
    }, 300);
  };

  const isRemoteTyping = selectedId && typingMap[selectedId];

  const searchLower = search.trim().toLowerCase();
  const filteredConversations = searchLower
    ? conversations.filter((c) =>
        (c.client_name || "").toLowerCase().includes(searchLower)
      )
    : conversations;

  const hasConversation = (student) =>
    conversations.some((c) => String(c.client_user_id) === String(studentIdInConv(student)));
  const filteredActiveStudents = searchLower
    ? activeStudents.filter((s) => {
        const name = (s.full_name || s.name || "").toLowerCase();
        const email = (s.email || "").toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      })
    : activeStudents;

  const selectStudentForChat = (student) => {
    const uid = studentIdInConv(student);
    setSelectedStudent(student);
    const existing = conversations.find((c) => String(c.client_user_id) === String(uid));
    if (existing) {
      setSelectedId(existing.id);
    } else {
      setSelectedId(null);
      setMessages([]);
    }
  };

  const groupedMessages = (() => {
    const chronological = [...messages].reverse();
    return chronological.reduce((acc, m) => {
      const date = m.created_at ? new Date(m.created_at).toDateString() : "";
      if (!acc[date]) acc[date] = [];
      acc[date].push(m);
      return acc;
    }, {});
  })();

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Left: conversation list */}
      <div className="w-[320px] flex flex-col border-r border-gray-200 bg-gray-50/50">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Mesajlar</h1>
            {wsConnected && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Canlı
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Öğrenci ara..."
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/30 focus:border-[#155DFC]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="p-4 text-sm text-gray-500">Yükleniyor...</div>
          ) : (
            <>
              {filteredConversations.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Konuşmalar</div>
                  {filteredConversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedId(c.id); setSelectedStudent(null); }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-100/80 transition ${
                        selectedId === c.id ? "bg-[#E8F0FE]" : ""
                      }`}
                    >
                      <img
                        src={c.client_avatar || AVATAR_PLACEHOLDER + (c.client_user_id || c.id)}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 truncate">{c.client_name || "Öğrenci"}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">{formatMessageTime(c.last_message_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-0.5">{c.last_message_preview || "Henüz mesaj yok"}</p>
                        {c.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#155DFC] text-[10px] font-medium text-white mt-1">
                            {c.unread_count > 99 ? "99+" : c.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 py-2">
                <div className="flex items-center justify-between gap-2 px-4 py-1.5">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Aktif öğrenciler
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchActiveStudents()}
                    disabled={loadingStudents}
                    className="text-xs text-[#155DFC] hover:underline disabled:opacity-50"
                  >
                    Yenile
                  </button>
                </div>
                {loadingStudents ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Yükleniyor...</div>
                ) : filteredActiveStudents.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    {searchLower ? "Bu aramada öğrenci yok." : "Aktif öğrenci yok."}
                  </div>
                ) : (
                  filteredActiveStudents.map((s) => {
                    const uid = studentIdInConv(s);
                    const hasConv = hasConversation(s);
                    return (
                      <button
                        key={uid}
                        type="button"
                        onClick={() => selectStudentForChat(s)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-100/80 transition"
                      >
                        <img
                          src={s.profile_photo_url || s.avatar || AVATAR_PLACEHOLDER + uid}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{s.full_name || s.name || s.email || "Öğrenci"}</div>
                          {s.email && <div className="text-xs text-gray-500 truncate">{s.email}</div>}
                        </div>
                        {hasConv ? (
                          <span className="text-xs text-[#155DFC]">Konuşmaya git</span>
                        ) : (
                          <span className="text-xs text-gray-600">Mesaj yaz</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {!chatTarget ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Öğrenci seçin veya konuşma başlatın
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <img
                  src={chatTarget.client_avatar || AVATAR_PLACEHOLDER + (chatTarget.client_user_id || "")}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-gray-900">{chatTarget.client_name || "Öğrenci"}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {wsConnected && <span className="w-2 h-2 rounded-full bg-green-500" />}
                    {wsConnected ? "Çevrimiçi" : "Çevrimdışı"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col p-4">
              {loadingMessages ? (
                <div className="py-4 text-center text-sm text-gray-500">Mesajlar yükleniyor...</div>
              ) : (
                <>
                  {hasMore && (
                    <div className="flex justify-center py-2">
                      <button
                        type="button"
                        onClick={loadOlder}
                        disabled={loadingMore}
                        className="text-sm text-[#155DFC] hover:underline disabled:opacity-50"
                      >
                        {loadingMore ? "Yükleniyor..." : "Daha eski mesajlar"}
                      </button>
                    </div>
                  )}
                  {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                    <div key={dateKey}>
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full">
                          {formatDateSeparator(msgs[0]?.created_at)}
                        </span>
                      </div>
                      {msgs.map((m) => {
                        const isCoach = m.sender_type === "coach";
                        const isImage = m.message_type === "image" && m.media_url;
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isCoach ? "justify-end" : "justify-start"} mb-3`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                isCoach
                                  ? "bg-[#155DFC] text-white"
                                  : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                              }`}
                            >
                              {isImage && (
                                <img
                                  src={m.media_url}
                                  alt=""
                                  className="max-w-[280px] max-h-[300px] rounded-lg mb-1 cursor-pointer object-cover"
                                  onClick={() => window.open(m.media_url, "_blank")}
                                />
                              )}
                              {m.body && (
                                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                              )}
                              {!isImage && !m.body && (
                                <p className="text-sm italic opacity-70">(mesaj)</p>
                              )}
                              <div className={`flex items-center gap-1 mt-1 ${isCoach ? "text-blue-100" : "text-gray-400"}`}>
                                <span className="text-xs">{formatMessageTime(m.created_at)}</span>
                                {isCoach && (
                                  <span className="text-xs">
                                    {m.read_at ? "✔✔" : "✔"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {isRemoteTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="bg-white text-gray-500 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm italic">
                        yazıyor...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              {sendError && (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                  <span>{sendError}</span>
                  <button type="button" onClick={() => setSendError(null)} className="text-red-600 hover:text-red-800">×</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                {/* Image upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || sending}
                  className="rounded-xl border border-gray-200 bg-white p-3 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition"
                  title="Fotoğraf gönder"
                >
                  {uploadingImage ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <textarea
                  value={sendBody}
                  onChange={(e) => { setSendBody(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Bir mesaj yazın..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/30 focus:border-[#155DFC]"
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!sendBody.trim() || sending}
                  className="rounded-xl bg-[#155DFC] text-white p-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1250d4] transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: client details */}
      <div className="w-[280px] flex flex-col border-l border-gray-200 bg-white overflow-y-auto">
        {chatTarget ? (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col items-center text-center">
                <img
                  src={chatTarget.client_avatar || AVATAR_PLACEHOLDER + (chatTarget.client_user_id || "")}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="mt-2 font-semibold text-gray-900">{chatTarget.client_name || "Öğrenci"}</div>
                <div className="text-xs text-gray-500">Üye</div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hedef</div>
                <div className="mt-1 text-sm font-medium text-gray-800">{GOAL_TR[studentGoal] || studentGoal || "—"}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vücut</div>
                <div className="mt-1 text-sm text-gray-700">
                  {studentWeight ? `${studentWeight} kg` : "—"}
                  {studentHeight ? ` · ${studentHeight} cm` : ""}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Program Durumu</div>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hasWorkout ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-sm text-gray-700">Antrenman</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hasNutrition ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-sm text-gray-700">Beslenme</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 text-sm text-gray-500">Bir öğrenci seçin.</div>
        )}
      </div>
    </div>
  );
}
