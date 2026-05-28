"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/providers";

interface LikedCtx {
  isLiked: (id: number) => boolean;
  setLiked: (id: number, liked: boolean) => void;
}

const LikedCtx = createContext<LikedCtx>({
  isLiked: () => false,
  setLiked: () => {},
});

export function useLiked() {
  return useContext(LikedCtx);
}

export function LikedArticlesProvider({
  ids,
  children,
}: {
  ids: number[];
  children: React.ReactNode;
}) {
  const { token } = useUser();
  const [likedSet, setLikedSet] = useState<Set<number>>(new Set());
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!token || !ids.length) return;
    fetch(`/api/articles/liked-ids?ids=${idsKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: number[]) => setLikedSet(new Set(data)))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, idsKey]);

  const isLiked = useCallback((id: number) => likedSet.has(id), [likedSet]);
  const setLiked = useCallback((id: number, liked: boolean) => {
    setLikedSet((prev) => {
      const next = new Set(prev);
      liked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const ctx = useMemo(() => ({ isLiked, setLiked }), [isLiked, setLiked]);

  return <LikedCtx.Provider value={ctx}>{children}</LikedCtx.Provider>;
}
