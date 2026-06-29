import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createDesktopFileStorage } from "@/lib/persistStorage";

export interface UnfollowedActorRecord {
  did: string;
  handle: string;
  recordedAt: string;
}

interface UnfollowedActorState {
  records: Record<string, UnfollowedActorRecord>;
  addRecord: (actor: { did: string; handle: string }) => void;
  hasRecord: (did: string) => boolean;
}

export const useUnfollowedActorStore = create<UnfollowedActorState>()(
  persist(
    (set, get) => ({
      records: {},
      addRecord: (actor) =>
        set((s) => ({
          records: {
            ...s.records,
            [actor.did]: {
              did: actor.did,
              handle: actor.handle,
              recordedAt: new Date().toISOString(),
            },
          },
        })),
      hasRecord: (did) => Boolean(get().records[did]),
    }),
    {
      name: "bsky-unfollowed-actors",
      storage: createJSONStorage(() => createDesktopFileStorage()),
    }
  )
);
