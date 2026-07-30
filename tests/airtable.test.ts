import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import {
  AirtableError,
  describeError,
  getCamps,
  readCredential,
  resolveCampImage,
  checkAirtableConnection,
} from "../api/_lib/airtable.js";

const realFetch = globalThis.fetch;

function stubFetch(handler: (url: string) => { status: number; body: unknown }) {
  globalThis.fetch = (async (input: string | URL) => {
    const { status, body } = handler(String(input));
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

function campRecord(id: string, name: string, extraFields: Record<string, unknown> = {}) {
  return { id, fields: { "Camp Name": name, "Age Group": "5-12", ...extraFields } };
}

beforeEach(() => {
  process.env.AIRTABLE_API_KEY = "patTESTKEY000000";
  process.env.AIRTABLE_BASE_ID = "appTESTBASE00000";
  process.env.AIRTABLE_TABLE_NAME = "Camps";
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.AIRTABLE_API_KEY;
  delete process.env.AIRTABLE_BASE_ID;
  delete process.env.AIRTABLE_TABLE_NAME;
});

test("readCredential strips whitespace and quotes left over from a pasted key", () => {
  process.env.AIRTABLE_API_KEY = '  "patROTATED123"\n';
  assert.equal(readCredential("AIRTABLE_API_KEY"), "patROTATED123");
});

test("readCredential treats scaffolding placeholders as unset", () => {
  process.env.AIRTABLE_API_KEY = "replace_with_your_airtable_key";
  assert.equal(readCredential("AIRTABLE_API_KEY"), undefined);
});

test("getCamps reports a revoked key instead of returning an empty list", async () => {
  stubFetch(() => ({ status: 401, body: { error: { type: "AUTHENTICATION_REQUIRED" } } }));

  const error = await getCamps().then(
    () => null,
    (thrown: unknown) => thrown,
  );

  assert.ok(error instanceof AirtableError, "expected an AirtableError, not an empty result");
  assert.equal(error.code, "unauthorized");
  assert.equal(describeError(error).status, 503);
});

test("getCamps reports missing credentials rather than pretending the base is empty", async () => {
  delete process.env.AIRTABLE_API_KEY;

  const error = await getCamps().then(
    () => null,
    (thrown: unknown) => thrown,
  );

  assert.ok(error instanceof AirtableError);
  assert.equal(error.code, "missing_credentials");
});

test("getCamps maps records, drops hidden ones, and follows pagination", async () => {
  stubFetch((url) => {
    if (url.includes("Registration_Options")) {
      return { status: 200, body: { records: [{ id: "opt1", fields: { Camps: ["rec1"], option_name: "Week 1" } }] } };
    }
    if (url.includes("offset=page2")) {
      return { status: 200, body: { records: [campRecord("rec3", "Third Camp")] } };
    }
    return {
      status: 200,
      body: {
        records: [
          campRecord("rec1", "First Camp"),
          campRecord("rec2", "Hidden Camp", { hide: true }),
        ],
        offset: "page2",
      },
    };
  });

  const camps = await getCamps();

  assert.deepEqual(
    camps.map((camp) => camp.slug),
    ["first-camp", "third-camp"],
  );
  assert.equal(camps[0].hasRegistrationDetail, true);
  assert.equal(camps[1].hasRegistrationDetail, false);
  assert.deepEqual({ min: camps[0].ageMin, max: camps[0].ageMax }, { min: 5, max: 12 });
});

test("camps without a Primary Image expose no image urls at all", async () => {
  stubFetch((url) =>
    url.includes("Registration_Options")
      ? { status: 200, body: { records: [] } }
      : {
          status: 200,
          body: {
            records: [
              campRecord("recNoPhotos0001", "No Photo Camp"),
              // Gallery photos without a primary must stay hidden, so the page has nothing to render.
              campRecord("recGalleryOnly1", "Gallery Only Camp", {
                "Gallery Images": [{ url: "https://airtable.example/g1.jpg" }],
              }),
            ],
          },
        },
  );

  for (const camp of await getCamps()) {
    assert.equal(camp.imageUrl, null);
    assert.deepEqual(camp.galleryImages, []);
  }
});

test("camp photos are exposed as stable /api/camp-image paths, never Airtable's expiring urls", async () => {
  stubFetch((url) =>
    url.includes("Registration_Options")
      ? { status: 200, body: { records: [] } }
      : {
          status: 200,
          body: {
            records: [
              campRecord("recPhotoCamp001", "Photo Camp", {
                "Primary Image": [{ url: "https://airtable.example/primary.jpg", filename: "primary.jpg" }],
                "Gallery Images": [
                  ...Array.from({ length: 10 }, (_, i) => ({ url: `https://airtable.example/g${i}.jpg` })),
                  { filename: "no-url.jpg" },
                ],
              }),
            ],
          },
        },
  );

  const [camp] = await getCamps();

  assert.equal(camp.imageUrl, "/api/camp-image?camp=recPhotoCamp001&i=0");
  assert.equal(camp.galleryImages.length, 9, "gallery is capped so primary + gallery stays at 10");
  assert.equal(camp.galleryImages[0], "/api/camp-image?camp=recPhotoCamp001&i=1");
  assert.ok(
    !JSON.stringify(camp).includes("airtable.example"),
    "expiring Airtable urls must never reach the browser",
  );
});

test("resolveCampImage returns the current url, preferring Airtable's thumbnails", async () => {
  stubFetch(() => ({
    status: 200,
    body: {
      id: "recPhotoCamp001",
      fields: {
        "Camp Name": "Photo Camp",
        "Primary Image": [
          {
            url: "https://airtable.example/full.jpg",
            thumbnails: { small: { url: "https://airtable.example/small.jpg" }, large: { url: "https://airtable.example/large.jpg" } },
          },
        ],
        "Gallery Images": [{ url: "https://airtable.example/g1.jpg" }],
      },
    },
  }));

  assert.equal(await resolveCampImage("recPhotoCamp001", 0, "full"), "https://airtable.example/full.jpg");
  assert.equal(await resolveCampImage("recPhotoCamp001", 0, "large"), "https://airtable.example/large.jpg");
  assert.equal(await resolveCampImage("recPhotoCamp001", 1, "full"), "https://airtable.example/g1.jpg");
  // No thumbnail generated for this attachment, so it falls back to the original.
  assert.equal(await resolveCampImage("recPhotoCamp001", 1, "small"), "https://airtable.example/g1.jpg");
  assert.equal(await resolveCampImage("recPhotoCamp001", 5, "full"), null, "out of range is a missing image");
});

test("resolveCampImage reports a deleted camp as a missing image rather than an error", async () => {
  stubFetch(() => ({ status: 404, body: { error: { type: "MODEL_ID_NOT_FOUND" } } }));

  assert.equal(await resolveCampImage("recDeleted00001", 0, "full"), null);
});

test("getCamps still returns camps when only the sort-hint table fails", async () => {
  stubFetch((url) =>
    url.includes("Registration_Options")
      ? { status: 404, body: { error: { type: "TABLE_NOT_FOUND" } } }
      : { status: 200, body: { records: [campRecord("rec1", "First Camp")] } },
  );

  const camps = await getCamps();

  assert.equal(camps.length, 1);
  assert.equal(camps[0].hasRegistrationDetail, false);
});

test("checkAirtableConnection surfaces the failure without leaking the key", async () => {
  stubFetch(() => ({ status: 403, body: { error: { type: "NOT_AUTHORIZED" } } }));

  const status = await checkAirtableConnection();

  assert.equal(status.ok, false);
  assert.equal(status.code, "forbidden");
  assert.ok(!status.error?.includes(process.env.AIRTABLE_API_KEY!));
  assert.ok(!JSON.stringify(status).includes(process.env.AIRTABLE_BASE_ID!));
});
