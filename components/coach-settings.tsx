"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { CoachConfig, DEFAULT_COACH_CONFIG } from "@/lib/coach/config";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const COACH_CONFIG_STORAGE_KEY = "squire-coach-config-v1";

export function readCoachConfig(): CoachConfig | null {
  try {
    const raw = sessionStorage.getItem(COACH_CONFIG_STORAGE_KEY) ?? localStorage.getItem(COACH_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CoachConfig>;
    if (!value.baseUrl || !value.apiKey || !value.model) return null;
    return { baseUrl: value.baseUrl, apiKey: value.apiKey, model: value.model };
  } catch { return null; }
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CoachConfig | null;
  onChange: (config: CoachConfig | null) => void;
};

export function CoachSettings({ open, onOpenChange, value, onChange }: Props) {
  const [draft, setDraft] = useState<CoachConfig>(value ?? DEFAULT_COACH_CONFIG);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    // Opening the dialog intentionally refreshes its editable draft from the saved value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(value ?? DEFAULT_COACH_CONFIG);
    setRemember(Boolean(localStorage.getItem(COACH_CONFIG_STORAGE_KEY)));
    setError("");
  }, [open, value]);

  function save() {
    const config = { baseUrl: draft.baseUrl.trim(), apiKey: draft.apiKey.trim(), model: draft.model.trim() };
    try {
      const url = new URL(config.baseUrl);
      if (url.protocol !== "https:" || !config.apiKey || !config.model) throw new Error();
    } catch {
      setError("请填写 HTTPS API 地址、API Key 和模型名称。");
      return;
    }
    const serialized = JSON.stringify(config);
    sessionStorage.setItem(COACH_CONFIG_STORAGE_KEY, serialized);
    if (remember) localStorage.setItem(COACH_CONFIG_STORAGE_KEY, serialized);
    else localStorage.removeItem(COACH_CONFIG_STORAGE_KEY);
    onChange(config);
    onOpenChange(false);
  }

  function clear() {
    sessionStorage.removeItem(COACH_CONFIG_STORAGE_KEY);
    localStorage.removeItem(COACH_CONFIG_STORAGE_KEY);
    setDraft(DEFAULT_COACH_CONFIG);
    onChange(null);
    onOpenChange(false);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="coach-settings-dialog">
      <DialogHeader>
        <DialogTitle><KeyRound size={19} />连接你的 AI 老师</DialogTitle>
        <DialogDescription>每位用户使用自己的 OpenAI 兼容 API。Key 只保存在当前浏览器，并在你主动请求讲解时经本站转发给所填服务商。</DialogDescription>
      </DialogHeader>
      <div className="coach-settings-fields">
        <label>API 地址<input type="url" value={draft.baseUrl} onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })} placeholder="https://api.openai.com/v1" autoComplete="url" /></label>
        <label>模型名称<input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} placeholder="例如 gpt-4.1-mini" autoComplete="off" /></label>
        <label>API Key<input type="password" value={draft.apiKey} onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })} placeholder="只属于当前用户" autoComplete="off" /></label>
        <label className="coach-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span><strong>在这台设备上记住</strong><small>关闭时仅保留到本次浏览器会话结束；共享电脑请勿勾选。</small></span></label>
        <p className="coach-security"><ShieldCheck size={15} />本站不会把 Key 写入棋谱、账户或服务端数据库，也不会缓存不同用户的老师回答。</p>
        {error && <p role="alert" className="coach-settings-error">{error}</p>}
      </div>
      <DialogFooter>
        {value && <button type="button" className="coach-clear" onClick={clear}><Trash2 size={14} />清除配置</button>}
        <button type="button" className="tool-button" onClick={() => onOpenChange(false)}>取消</button>
        <button type="button" className="tool-button primary" onClick={save}>保存并启用</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
