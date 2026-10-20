"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { GameState } from "@/lib/types";
export function useGame(code: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const busyRef = useRef(false);
  const sequence = useRef(0);
  const alive = useRef(true);
  const commit = useCallback((data: GameState, started: number, id: number) => {
    if (!alive.current || sequence.current !== id) return;
    setState(data);
    setOffset(Date.parse(data.serverNow) - (started + Date.now()) / 2);
    setError("");
  }, []);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!code || busyRef.current) return;
      const id = ++sequence.current;
      const started = Date.now();
      try {
        commit(
          await api<GameState>(
            `state?code=${encodeURIComponent(code)}`,
            undefined,
            signal,
          ),
          started,
          id,
        );
      } catch (e) {
        if (!signal?.aborted && alive.current && sequence.current === id)
          setError((e as Error).message);
      }
    },
    [code, commit],
  );
  useEffect(() => {
    alive.current = true;
    setState(null);
    setError("");
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      await refresh(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(poll, 3000);
    }
    void poll();
    const visible = () => {
      if (document.visibilityState === "visible")
        void refresh(controller.signal);
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", visible);
    return () => {
      alive.current = false;
      ++sequence.current;
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", visible);
    };
  }, [refresh]);
  const act = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError("");
      const id = ++sequence.current;
      const started = Date.now();
      try {
        const data = await api<GameState>("game", { action, code, ...payload });
        commit(data, started, id);
        return data;
      } catch (e) {
        if (alive.current)
          setError(
            `${(e as Error).message} Tu última acción podría haberse guardado; estamos recuperando el estado.`,
          );
      } finally {
        busyRef.current = false;
        if (alive.current) setBusy(false);
      }
    },
    [code, commit],
  );
  return { state, error, busy, offset, act, refresh };
}
