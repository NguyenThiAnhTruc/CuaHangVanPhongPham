"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  CheckCheck,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { Conversation, Message, Profile, supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type ConversationWithProfile = Conversation & {
  profile?: Profile;
  last_message_content?: string;
  last_sender_role?: "customer" | "admin";
  unread_count?: number;
};

interface AdminConversationRow {
  id: string;
  user_id: string;
  order_id: string | null;
  status: "open" | "closed";
  last_message_at: string;
  created_at: string;
  updated_at: string;
  customer_email: string;
  customer_full_name: string;
  customer_phone: string;
  last_message_content: string | null;
  last_sender_role: "customer" | "admin" | null;
  unread_count: number;
}

export function AdminMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>(
    [],
  );
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const toConversation = (
    row: AdminConversationRow,
  ): ConversationWithProfile => ({
    id: row.id,
    user_id: row.user_id,
    order_id: row.order_id,
    status: row.status,
    last_message_at: row.last_message_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_message_content: row.last_message_content ?? "",
    last_sender_role: row.last_sender_role ?? undefined,
    unread_count: Number(row.unread_count ?? 0),
    profile: {
      id: row.user_id,
      email: row.customer_email || "",
      full_name: row.customer_full_name || "",
      phone: row.customer_phone || "",
      address: "",
      avatar_url: "",
      is_admin: false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.rpc("get_admin_conversations");

    if (error) {
      setError(
        "Không thể tải danh sách chat. Hãy chạy migration chat mới nhất.",
      );
      setLoading(false);
      return;
    }

    const nextConversations = ((data ?? []) as AdminConversationRow[]).map(
      toConversation,
    );

    setConversations(nextConversations);
    setSelectedConversation((current) => {
      if (current) {
        return nextConversations.find((item) => item.id === current.id) ?? null;
      }
      return nextConversations[0] ?? null;
    });
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(
    async (conversationId: string, markAsRead = true) => {
      setMessagesLoading(true);
      setError("");

      const { data, error } = await supabase.rpc("get_conversation_messages", {
        p_conversation_id: conversationId,
      });

      if (error) {
        setError("Không thể tải nội dung chat. Hãy chạy migration chat mới nhất.");
        setMessagesLoading(false);
        return;
      }

      setMessages((data ?? []) as Message[]);

      if (markAsRead) {
        await supabase.rpc("mark_conversation_messages_read", {
          p_conversation_id: conversationId,
        });
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unread_count: 0 }
              : conversation,
          ),
        );
      }

      setMessagesLoading(false);
      scrollToBottom();
    },
    [],
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    } else {
      setMessages([]);
    }
  }, [fetchMessages, selectedConversation]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const nextMessage = payload.new as Message;
          if (selectedConversation?.id === nextMessage.conversation_id) {
            fetchMessages(selectedConversation.id, false);
          }
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, fetchMessages, selectedConversation?.id]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = content.trim();
    if (!user || !selectedConversation || !text || sending) return;

    setSending(true);
    setError("");

    const { error } = await supabase.rpc("send_admin_message", {
      p_conversation_id: selectedConversation.id,
      p_content: text,
    });

    setSending(false);

    if (error) {
      setError("Không thể gửi tin nhắn. Hãy chạy migration chat mới nhất.");
      return;
    }

    setContent("");
    await fetchMessages(selectedConversation.id);
    await fetchConversations();
  };

  const updateStatus = async (status: "open" | "closed") => {
    if (!selectedConversation) return;

    const { error } = await supabase.rpc("set_conversation_status", {
      p_conversation_id: selectedConversation.id,
      p_status: status,
    });

    if (error) {
      setError("Không thể cập nhật trạng thái cuộc trò chuyện.");
      return;
    }

    await fetchConversations();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const customerName = (conversation: ConversationWithProfile) => {
    return (
      conversation.profile?.full_name ||
      conversation.profile?.email ||
      conversation.user_id.substring(0, 8).toUpperCase()
    );
  };

  const lastMessageLabel = (conversation: ConversationWithProfile) => {
    if (!conversation.last_message_content) return "Chưa có nội dung chat";
    const prefix =
      conversation.last_sender_role === "admin" ? "Admin: " : "Khách: ";
    return `${prefix}${conversation.last_message_content}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Chat với khách hàng
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Xem danh sách cuộc trò chuyện, đọc tin nhắn và phản hồi từng
              người mua.
            </p>
          </div>
          <button
            onClick={fetchConversations}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-[360px_1fr] gap-4">
          <aside className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-gray-800">
              Cuộc trò chuyện
            </div>
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                Chưa có tin nhắn nào từ người mua.
              </div>
            ) : (
              <div className="divide-y max-h-[660px] overflow-y-auto">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition ${
                      selectedConversation?.id === conversation.id
                        ? "bg-blue-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-gray-800 truncate">
                        {customerName(conversation)}
                      </p>
                      {Number(conversation.unread_count) > 0 && (
                        <span className="min-w-6 h-6 px-2 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {lastMessageLabel(conversation)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          conversation.status === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {conversation.status === "open" ? "Đang mở" : "Đã đóng"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="bg-white rounded-lg shadow-md overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="border-b px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {customerName(selectedConversation)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.profile?.email ||
                        selectedConversation.user_id}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateStatus(
                        selectedConversation.status === "open"
                          ? "closed"
                          : "open",
                      )
                    }
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {selectedConversation.status === "open"
                        ? "Đóng hội thoại"
                        : "Mở lại"}
                    </span>
                  </button>
                </div>

                <div className="h-[520px] overflow-y-auto p-6 bg-slate-50">
                  {messagesLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                      Chưa có nội dung chat.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isAdmin = message.sender_role === "admin";
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[82%] rounded-lg px-4 py-3 shadow-sm ${
                                isAdmin
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border text-gray-800"
                              }`}
                            >
                              <div className="text-xs opacity-75 mb-1">
                                {isAdmin
                                  ? "Admin"
                                  : customerName(selectedConversation)}{" "}
                                · {formatTime(message.created_at)}
                              </div>
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              {isAdmin && (
                                <div className="text-[11px] opacity-80 mt-2 flex items-center justify-end gap-1">
                                  <CheckCheck className="w-3 h-3" />
                                  {message.is_read ? "Khách đã đọc" : "Đã gửi"}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={sendMessage} className="border-t p-4 flex gap-3">
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Nhập phản hồi cho khách hàng..."
                    rows={2}
                    className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !content.trim()}
                    className="self-end bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                Chọn một cuộc trò chuyện để xem nội dung.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
