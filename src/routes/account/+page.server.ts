import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { setError, superValidate } from "sveltekit-superforms/server";
import { createContactSchema, emailSchema, passwordSchema, profileSchema } from "$lib/schemas";
import { getSubscriptionTier } from "$lib/server/subscriptions";
import { getContactsCount } from "$lib/server/contacts";
import { hasReachedMaxContacts } from "$lib/helpers";
import { supabaseAdmin } from "$lib/server/supabase-admin";

export const load: PageServerLoad = async (event) => {
  const { session } = await event.locals.safeGetSession();

  async function getUserProfile() {
    const { error: profileError, data: profile } = await event.locals.supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .single();

    if (profileError) {
      throw error(500, "Error retreiving your profile, please try again later.");
    }
    return profile;
  }

  return {
    profileForm: superValidate(await getUserProfile(), profileSchema, {
      id: "profile"
    }),
    emailForm: superValidate({ email: session?.user.email }, emailSchema, {
      id: "email"
    }),
    passwordForm: superValidate(passwordSchema, {
      id: "password"
    }),
    tier: getSubscriptionTier(session!.user.id)
  };
};

export const actions: Actions = {
  createContact: async (event) => {
    const { session } = await event.locals.safeGetSession();
    if (!session) {
      throw error(401, "Unauthorized");
    }

    const [tier, count, createContactForm] = await Promise.all([
      getSubscriptionTier(session.user.id),
      getContactsCount(session.user.id),
      superValidate(event, createContactSchema, {
        id: "create"
      })
    ]);

    if (hasReachedMaxContacts(tier, count)) {
      throw error(
        403,
        "You have reached the max number of contacts for your tier. Please upgrade."
      );
    }

    if (!createContactForm.valid) {
      return fail(400, {
        createContactForm
      });
    }

    const { error: createContactError } = await supabaseAdmin.from("contacts").insert({
      ...createContactForm.data,
      user_id: session.user.id
    });

    if (createContactError) {
      console.log(createContactError);
      return setError(createContactForm, null, "Error creating contact.");
    }

    return {
      createContactForm
    };
  }
};
