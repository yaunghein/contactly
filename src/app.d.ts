import type { Database } from "$lib/supabase-types";
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";

declare global {
  /// <reference types="stripe-event-types" />
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
      session: Session | null;
      user: User | null;
    }
    interface PageData {
      session: Session | null;
    }
    // interface Platform {}
  }
}

export {};
