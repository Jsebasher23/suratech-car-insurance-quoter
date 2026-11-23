#!/bin/sh
# Generates per-installation secrets on first boot and keeps them on the data volume,
# so no secret is ever committed to the repository (ADR-0004). Explicit env vars win.
set -e
SECRETS_FILE=/app/.tmp/.secrets.env
if [ ! -f "$SECRETS_FILE" ]; then
  gen() { node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"; }
  {
    echo "APP_KEYS=$(gen),$(gen),$(gen),$(gen)"
    echo "API_TOKEN_SALT=$(gen)"
    echo "ADMIN_JWT_SECRET=$(gen)"
    echo "JWT_SECRET=$(gen)"
    echo "TRANSFER_TOKEN_SALT=$(gen)"
    echo "ENCRYPTION_KEY=$(gen)"
  } > "$SECRETS_FILE"
  chmod 600 "$SECRETS_FILE"
  echo "[entrypoint] generated secrets in $SECRETS_FILE"
fi
while IFS='=' read -r key value; do
  eval "current=\${$key:-}"
  [ -z "$current" ] && export "$key=$value"
done < "$SECRETS_FILE"
exec "$@"
