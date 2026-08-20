// const express = require("express");
// const axios = require("axios");
// const router = express.Router();
// const { SUPPORTED_OBJECTS, SORT_FIELD } = require("../config/objectFields");
// const FIELD_CONFIG = require("../config/objectFields");

// const API_VERSION = "v60.0";

// // Require an active Salesforce session for every route in this file.
// router.use((req, res, next) => {
//   if (!req.session.sf?.access_token) {
//     return res.status(401).json({ error: "Not logged in to Salesforce" });
//   }
//   next();
// });

// // Refresh the access token if Salesforce says it's expired, then retry once.
// async function sfRequest(req, config) {
//   const call = (token) =>
//     axios({
//       ...config,
//       baseURL: req.session.sf.instance_url,
//       headers: { ...(config.headers || {}), Authorization: `Bearer ${token}` },
//     });

//   try {
//     return await call(req.session.sf.access_token);
//   } catch (err) {
//     const isExpired = err.response?.status === 401 && req.session.sf.refresh_token;
//     if (!isExpired) throw err;

//     const refreshRes = await axios.post(
//       `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
//       new URLSearchParams({
//         grant_type: "refresh_token",
//         refresh_token: req.session.sf.refresh_token,
//         client_id: process.env.SF_CLIENT_ID,
//         client_secret: process.env.SF_CLIENT_SECRET,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     req.session.sf.access_token = refreshRes.data.access_token;
//     return call(req.session.sf.access_token);
//   }
// }

// function assertSupportedObject(req, res, next) {
//   if (!SUPPORTED_OBJECTS.includes(req.params.object)) {
//     return res.status(400).json({ error: `Unsupported object: ${req.params.object}` });
//   }
//   next();
// }

// // GET /api/describe/:object -> field metadata for the object's chosen field set
// router.get("/describe/:object", assertSupportedObject, async (req, res) => {
//   try {
//     const objectName = req.params.object;
//     const wantedFields = new Set(FIELD_CONFIG[objectName]);

//     const { data } = await sfRequest(req, {
//       method: "GET",
//       url: `/services/data/${API_VERSION}/sobjects/${objectName}/describe`,
//     });

//     const fields = data.fields
//       .filter((f) => wantedFields.has(f.name))
//       .sort((a, b) => FIELD_CONFIG[objectName].indexOf(a.name) - FIELD_CONFIG[objectName].indexOf(b.name))
//       .map((f) => ({
//         name: f.name,
//         label: f.label,
//         type: f.type, // string, textarea, picklist, double, currency, date, phone, email, ...
//         createable: f.createable,
//         updateable: f.updateable,
//         nillable: f.nillable,
//         picklistValues: f.picklistValues?.filter((p) => p.active).map((p) => ({ label: p.label, value: p.value })) || [],
//       }));

//     res.json({ object: objectName, label: data.label, fields });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(err.response?.status || 500).json({ error: "Failed to describe object", detail: err.response?.data });
//   }
// });

// // GET /api/records/:object?offset=0&limit=20 -> a page of records, newest first
// router.get("/records/:object", assertSupportedObject, async (req, res) => {
//   try {
//     const objectName = req.params.object;
//    const requestedLimit = Number.parseInt(req.query.limit, 10);
// const requestedOffset = Number.parseInt(req.query.offset, 10);

// const limit =
//   Number.isInteger(requestedLimit) && requestedLimit > 0
//     ? Math.min(requestedLimit, 20)
//     : 20;

// const offset =
//   Number.isInteger(requestedOffset) && requestedOffset >= 0
//     ? requestedOffset
//     : 0;

// const fieldList = ["Id", ...FIELD_CONFIG[objectName]].join(",");

// const soql = `
//   SELECT ${fieldList}
//   FROM ${objectName}
//   ORDER BY ${SORT_FIELD[objectName]} DESC
//   LIMIT ${limit}
//   OFFSET ${offset}
// `.replace(/\s+/g, " ").trim();

//     const { data } = await sfRequest(req, {
//       method: "GET",
//       url: `/services/data/${API_VERSION}/query`,
//       params: { q: soql },
//     });

//     res.json({
//       records: data.records.map(({ attributes, ...rest }) => rest),
//       hasMore: data.records.length === limit,
//     });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(err.response?.status || 500).json({ error: "Failed to fetch records", detail: err.response?.data });
//   }
// });

// // POST /api/records/:object -> create
// router.post("/records/:object", assertSupportedObject, async (req, res) => {
//   try {
//     const objectName = req.params.object;
//     const { data } = await sfRequest(req, {
//       method: "POST",
//       url: `/services/data/${API_VERSION}/sobjects/${objectName}`,
//       headers: { "Content-Type": "application/json" },
//       data: req.body,
//     });
//     res.status(201).json(data);
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(err.response?.status || 500).json({ error: "Failed to create record", detail: err.response?.data });
//   }
// });

// // PATCH /api/records/:object/:id -> update
// router.patch("/records/:object/:id", assertSupportedObject, async (req, res) => {
//   try {
//     const objectName = req.params.object;
//     await sfRequest(req, {
//       method: "PATCH",
//       url: `/services/data/${API_VERSION}/sobjects/${objectName}/${req.params.id}`,
//       headers: { "Content-Type": "application/json" },
//       data: req.body,
//     });
//     res.status(204).end();
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(err.response?.status || 500).json({ error: "Failed to update record", detail: err.response?.data });
//   }
// });

// // DELETE /api/records/:object/:id -> delete
// router.delete("/records/:object/:id", assertSupportedObject, async (req, res) => {
//   try {
//     const objectName = req.params.object;
//     await sfRequest(req, {
//       method: "DELETE",
//       url: `/services/data/${API_VERSION}/sobjects/${objectName}/${req.params.id}`,
//     });
//     res.status(204).end();
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(err.response?.status || 500).json({ error: "Failed to delete record", detail: err.response?.data });
//   }
// });

// module.exports = router;







//new code
const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  SUPPORTED_OBJECTS,
  SORT_FIELD,
} = require("../config/objectFields");

const FIELD_CONFIG = require("../config/objectFields");

const API_VERSION = "v60.0";

// --------------------------------------------------
// Require an active Salesforce session
// --------------------------------------------------
router.use((req, res, next) => {
  if (!req.session.sf?.access_token) {
    return res.status(401).json({
      error: "Not logged in to Salesforce",
    });
  }

  next();
});

// --------------------------------------------------
// Salesforce API request helper
// Automatically refreshes expired access token
// --------------------------------------------------
async function sfRequest(req, config) {
  const call = (token) =>
    axios({
      ...config,
      baseURL: req.session.sf.instance_url,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  try {
    // First try using the current access token
    return await call(req.session.sf.access_token);
  } catch (err) {
    // If token expired, try refresh token
    const isExpired =
      err.response?.status === 401 &&
      req.session.sf.refresh_token;

    if (!isExpired) {
      throw err;
    }

    console.log("Salesforce access token expired. Refreshing token...");

    const refreshRes = await axios.post(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: req.session.sf.refresh_token,
        client_id: process.env.SF_CLIENT_ID,
        client_secret: process.env.SF_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Save the new access token
    req.session.sf.access_token = refreshRes.data.access_token;

    // Salesforce may return a new refresh token
    // when refresh-token rotation is enabled.
    if (refreshRes.data.refresh_token) {
      req.session.sf.refresh_token =
        refreshRes.data.refresh_token;
    }

    // Retry the original Salesforce request
    return call(req.session.sf.access_token);
  }
}

// --------------------------------------------------
// Check whether the requested Salesforce object
// is supported by our application
// --------------------------------------------------
function assertSupportedObject(req, res, next) {
  if (!SUPPORTED_OBJECTS.includes(req.params.object)) {
    return res.status(400).json({
      error: `Unsupported object: ${req.params.object}`,
    });
  }

  next();
}

// ==================================================
// GET /api/describe/:object
// Get field metadata for an object
// ==================================================
router.get(
  "/describe/:object",
  assertSupportedObject,
  async (req, res) => {
    try {
      const objectName = req.params.object;

      const wantedFields = new Set(
        FIELD_CONFIG[objectName]
      );

      const { data } = await sfRequest(req, {
        method: "GET",
        url: `/services/data/${API_VERSION}/sobjects/${objectName}/describe`,
      });

      const fields = data.fields
        .filter((field) =>
          wantedFields.has(field.name)
        )
        .sort(
          (a, b) =>
            FIELD_CONFIG[objectName].indexOf(a.name) -
            FIELD_CONFIG[objectName].indexOf(b.name)
        )
        .map((field) => ({
          name: field.name,
          label: field.label,
          type: field.type,

          createable: field.createable,
          updateable: field.updateable,
          nillable: field.nillable,

          picklistValues:
            field.picklistValues
              ?.filter((p) => p.active)
              .map((p) => ({
                label: p.label,
                value: p.value,
              })) || [],
        }));

      res.json({
        object: objectName,
        label: data.label,
        fields,
      });
    } catch (err) {
      console.error(
        err.response?.data || err.message
      );

      res.status(err.response?.status || 500).json({
        error: "Failed to describe object",
        detail: err.response?.data,
      });
    }
  }
);

// ==================================================
// GET /api/records/:object
// Get records with pagination
// Default = 20 records
// ==================================================
router.get(
  "/records/:object",
  assertSupportedObject,
  async (req, res) => {
    try {
      const objectName = req.params.object;

      // --------------------------------------------
      // Read limit from query string
      // --------------------------------------------
      const requestedLimit = Number.parseInt(
        req.query.limit,
        10
      );

      // --------------------------------------------
      // Read offset from query string
      // --------------------------------------------
      const requestedOffset = Number.parseInt(
        req.query.offset,
        10
      );

      // --------------------------------------------
      // Maximum 20 records per page
      // --------------------------------------------
      const limit =
        Number.isInteger(requestedLimit) &&
        requestedLimit > 0
          ? Math.min(requestedLimit, 20)
          : 20;

      // --------------------------------------------
      // Offset cannot be negative
      // --------------------------------------------
      const offset =
        Number.isInteger(requestedOffset) &&
        requestedOffset >= 0
          ? requestedOffset
          : 0;

      // --------------------------------------------
      // Build field list
      // --------------------------------------------
      const fieldList = [
        "Id",
        ...FIELD_CONFIG[objectName],
      ].join(",");

      // --------------------------------------------
      // Build SOQL query
      // --------------------------------------------
      const soql = `
        SELECT ${fieldList}
        FROM ${objectName}
        ORDER BY ${SORT_FIELD[objectName]} DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
        .replace(/\s+/g, " ")
        .trim();

      console.log("SOQL:", soql);

      // --------------------------------------------
      // Call Salesforce REST API
      // --------------------------------------------
      const { data } = await sfRequest(req, {
        method: "GET",
        url: `/services/data/${API_VERSION}/query`,
        params: {
          q: soql,
        },
      });

      // --------------------------------------------
      // Send records to frontend
      // --------------------------------------------
      res.json({
        records: data.records.map(
          ({ attributes, ...rest }) => rest
        ),

        hasMore:
          data.records.length === limit,
      });
    } catch (err) {
      console.error(
        err.response?.data || err.message
      );

      res.status(err.response?.status || 500).json({
        error: "Failed to fetch records",
        detail: err.response?.data,
      });
    }
  }
);

// ==================================================
// POST /api/records/:object
// Create a new record
// ==================================================
router.post(
  "/records/:object",
  assertSupportedObject,
  async (req, res) => {
    try {
      const objectName = req.params.object;

      const { data } = await sfRequest(req, {
        method: "POST",

        url: `/services/data/${API_VERSION}/sobjects/${objectName}`,

        headers: {
          "Content-Type": "application/json",
        },

        data: req.body,
      });

      res.status(201).json(data);
    } catch (err) {
      console.error(
        err.response?.data || err.message
      );

      res.status(err.response?.status || 500).json({
        error: "Failed to create record",
        detail: err.response?.data,
      });
    }
  }
);

// ==================================================
// PATCH /api/records/:object/:id
// Update an existing record
// ==================================================
router.patch(
  "/records/:object/:id",
  assertSupportedObject,
  async (req, res) => {
    try {
      const objectName = req.params.object;

      await sfRequest(req, {
        method: "PATCH",

        url: `/services/data/${API_VERSION}/sobjects/${objectName}/${req.params.id}`,

        headers: {
          "Content-Type": "application/json",
        },

        data: req.body,
      });

      res.status(204).end();
    } catch (err) {
      console.error(
        err.response?.data || err.message
      );

      res.status(err.response?.status || 500).json({
        error: "Failed to update record",
        detail: err.response?.data,
      });
    }
  }
);

// ==================================================
// DELETE /api/records/:object/:id
// Delete an existing record
// ==================================================
router.delete(
  "/records/:object/:id",
  assertSupportedObject,
  async (req, res) => {
    try {
      const objectName = req.params.object;

      await sfRequest(req, {
        method: "DELETE",

        url: `/services/data/${API_VERSION}/sobjects/${objectName}/${req.params.id}`,
      });

      res.status(204).end();
    } catch (err) {
      console.error(
        err.response?.data || err.message
      );

      res.status(err.response?.status || 500).json({
        error: "Failed to delete record",
        detail: err.response?.data,
      });
    }
  }
);

module.exports = router;