interface ImportMetaEnv {
  /** PostHog project key. Analytics are off when unset. */
  readonly PUBLIC_POSTHOG_KEY?: string;
  /** PostHog ingestion host. Defaults to https://us.i.posthog.com */
  readonly PUBLIC_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
