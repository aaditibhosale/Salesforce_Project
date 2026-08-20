// const express = require("express");
// const axios = require("axios");
// const router = express.Router();

// // Step 1: send the user to Salesforce's login/consent screen.
// router.get("/login", (req, res) => {
//   const params = new URLSearchParams({
//     response_type: "code",
//     client_id: process.env.SF_CLIENT_ID,
//     redirect_uri: process.env.SF_CALLBACK_URL,
//     scope: "api refresh_token offline_access",
//   });
//   res.redirect(`${process.env.SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`);
// });

// // Step 2: Salesforce redirects back here with a ?code=... we exchange for tokens.
// router.get("/callback", async (req, res) => {
//   const { code, error, error_description } = req.query;

//   if (error) {
//     return res.redirect(`${process.env.FRONTEND_URL}/?auth_error=${encodeURIComponent(error_description || error)}`);
//   }

//   try {
//     const tokenRes = await axios.post(
//       `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
//       new URLSearchParams({
//         grant_type: "authorization_code",
//         code,
//         client_id: process.env.SF_CLIENT_ID,
//         client_secret: process.env.SF_CLIENT_SECRET,
//         redirect_uri: process.env.SF_CALLBACK_URL,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const { access_token, refresh_token, instance_url } = tokenRes.data;

//     req.session.sf = { access_token, refresh_token, instance_url };
//     res.redirect(`${process.env.FRONTEND_URL}/?login=success`);
//   } catch (err) {
//     console.error("OAuth callback failed:", err.response?.data || err.message);
//     res.redirect(`${process.env.FRONTEND_URL}/?auth_error=token_exchange_failed`);
//   }
// });

// // Lets the frontend know whether this browser session is logged in.
// router.get("/status", (req, res) => {
//   if (req.session.sf?.access_token) {
//     return res.json({ loggedIn: true, instanceUrl: req.session.sf.instance_url });
//   }
//   res.json({ loggedIn: false });
// });

// router.post("/logout", (req, res) => {
//   req.session.destroy(() => res.json({ ok: true }));
// });

// module.exports = router;





//new code
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

// Create a PKCE code verifier
function generateCodeVerifier() {
  return crypto.randomBytes(64).toString("base64url");
}

// Create the PKCE code challenge from the verifier
function generateCodeChallenge(codeVerifier) {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

// Step 1: Send the user to Salesforce login/consent screen
router.get("/login", (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Save verifier in the user's session.
  // We need the same verifier when Salesforce sends us back.
  req.session.oauth_code_verifier = codeVerifier;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SF_CLIENT_ID,
    redirect_uri: process.env.SF_CALLBACK_URL,
    scope: "api refresh_token offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  res.redirect(
    `${process.env.SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`
  );
});

// Step 2: Salesforce redirects back here with ?code=...
// We exchange the code for access/refresh tokens.
router.get("/callback", async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/?auth_error=${encodeURIComponent(
        error_description || error
      )}`
    );
  }

  if (!code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/?auth_error=missing_authorization_code`
    );
  }

  // Get the same PKCE verifier that we saved during /login
  const codeVerifier = req.session.oauth_code_verifier;

  if (!codeVerifier) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/?auth_error=missing_code_verifier`
    );
  }

  try {
    const tokenRes = await axios.post(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.SF_CLIENT_ID,
        client_secret: process.env.SF_CLIENT_SECRET,
        redirect_uri: process.env.SF_CALLBACK_URL,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, instance_url } = tokenRes.data;

    // Save Salesforce login information in the session
    req.session.sf = {
      access_token,
      refresh_token,
      instance_url,
    };

    // Remove the temporary PKCE verifier
    delete req.session.oauth_code_verifier;

    res.redirect(`${process.env.FRONTEND_URL}/?login=success`);
  } catch (err) {
    console.error(
      "OAuth callback failed:",
      err.response?.data || err.message
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/?auth_error=token_exchange_failed`
    );
  }
});

// Let the frontend know whether this browser session is logged in
router.get("/status", (req, res) => {
  if (req.session.sf?.access_token) {
    return res.json({
      loggedIn: true,
      instanceUrl: req.session.sf.instance_url,
    });
  }

  res.json({ loggedIn: false });
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;