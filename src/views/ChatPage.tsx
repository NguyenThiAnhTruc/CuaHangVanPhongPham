"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCheck, MessageCircle, Send } from "lucide-react";
import { Conversation, Message, supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function ChatPage() {
  const { user, profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase.rpc("get_conversation_messages", {
      p_conversation_id: conversationId,
    });

    if (error) {
      setError("Không thể tải tin nhắn. Hãy chạy đầy đủ migration chat.");
      return;
    }

    setMessages((data ?? []) as Message[]);

    await supabase.rpc("mark_conversation_messages_read", {
      p_conversation_id: conversationId,
    });

    scrollToBottom();
  }, []);

  const loadConversation = useCallback(async () => {
    if (!user || profile?.is_admin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data: conversationId, error: rpcError } = await supabase.rpc(
      "get_or_create_customer_conversation",
    );

    if (rpcError || !conversationId) {
      setError("Không thể mở cuộc trò chuyện. Hãy chạy đủ migration chat.");
      setLoading(false);
      return;
    }

    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (conversationError || !conversationData) {
      setError("Không thể tải cuộc trò chuyện.");
      setLoading(false);
      return;
    }

    setConversation(conversationData as Conversation);
    await loadMessages(conversationId);
    setLoading(false);
  }, [loadMessages, profile?.is_admin, user]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`customer-chat-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => loadMessages(conversation.id),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, loadMessages]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = content.trim();
    if (!user || !conversation || !text || sending || profile?.is_admin) return;

    setSending(true);
    setError("");

    const { error } = await supabase.rpc("send_customer_message", {
      p_content: text,
    });

    setSending(false);

    if (error) {
      setError("Không thể gửi tin nhắn. Hãy chạy migration chat mới nhất.");
      return;
    }

    setContent("");
    await loadMessages(conversation.id);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-800">
              Vui lòng đăng nhập để chat với cửa hàng
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Admin trả lời chat trong trang quản trị
            </h1>
            <p className="text-gray-600 mt-2">
              Tài khoản admin không tạo cuộc chat người mua. Hãy vào Quản trị
              rồi mở tab Chat để đọc và phản hồi khách hàng.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Chat với Admin
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Hỏi về sản phẩm, giá bán, tồn kho, thanh toán, giao hàng hoặc
              trạng thái đơn hàng.
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="h-[520px] overflow-y-auto p-6 bg-slate-50">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Chưa có tin nhắn nào. Hãy gửi lời nhắn đầu tiên.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMine = message.sender_id === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-lg px-4 py-3 shadow-sm ${
                          isMine
                            ? "bg-blue-600 text-white"
                            : "bg-white border text-gray-800"
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1">
                          {isMine ? profile?.full_name || "Bạn" : "Admin"} ·{" "}
                          {formatTime(message.created_at)}
                        </div>
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {isMine && (
                          <div className="text-[11px] opacity-80 mt-2 flex items-center justify-end gap-1">
                            <CheckCheck className="w-3 h-3" />
                            {message.is_read ? "Admin đã đọc" : "Đã gửi"}
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
              placeholder="Nhập tin nhắn cho Admin..."
              rows={2}
              className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending || loading}
            />
            <button
              type="submit"
              disabled={sending || loading || !content.trim()}
              className="self-end bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
