const authConfig = {
  providers: [
    {
      // JWKS served at <deployment>.convex.site/.well-known/jwks.json
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
