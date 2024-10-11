import { z } from "zod";
import { superValidate, setError } from "sveltekit-superforms/server";
import { fail, redirect } from "@sveltejs/kit";
import { AuthApiError } from "@supabase/supabase-js";
import type { PageServerLoad, Actions } from "./$types";

const loginUserSchema = z.object({
  email: z.string().email("Please enter valid email."),
  password: z.string().min(1, "Please enter a password.")
});

export const load: PageServerLoad = async (event) => {
  return {
    form: superValidate(loginUserSchema)
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, loginUserSchema);

    if (!form.valid) {
      return fail(400, { form });
    }

    const { error: authError } = await event.locals.supabase.auth.signInWithPassword(form.data);
    if (authError) {
      if (authError instanceof AuthApiError && authError.status === 400) {
        setError(form, "email", "Invalid email or password.");
        setError(form, "password", "Invalid email or password.");
        return fail(400, { form });
      }
    }

    throw redirect(302, "/");
  }
};
