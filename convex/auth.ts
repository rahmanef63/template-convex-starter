import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = params.email as string;
        return { email, name: (params.name as string | undefined) || email };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) return args.existingUserId;
      const email = args.profile.email as string | undefined;
      if (email) {
        const existing = await ctx.db
          .query("users")
          // authTables ships a built-in "email" index; its name isn't surfaced
          // in the generated DataModel type at this auth version, so the index
          // arg + q are cast. Runtime is correct (matches fleet canon).
          .withIndex("email" as never, (q: any) => q.eq("email", email))
          .first();
        if (existing) return existing._id;
      }
      return ctx.db.insert("users", { email, name: (args.profile.name as string | undefined) ?? email });
    },
  },
});
