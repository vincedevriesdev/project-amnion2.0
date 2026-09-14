#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/etc/amnion/env"
CODE_FILE="/root/amnion-mobile-access-code.txt"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Dit script moet als root worden uitgevoerd." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "${ENV_FILE} bestaat niet; installeer Amnion eerst." >&2
  exit 1
fi

upsert_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "${ENV_FILE}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${ENV_FILE}"
  fi
}

action="${1:-}"
case "${action}" in
  enable)
    region_id="${2:-standalone}"
    region_name="${3:-Deze server}"
    if [[ ! "${region_id}" =~ ^[a-z0-9-]{2,24}$ ]]; then
      echo "Regio-id mag alleen kleine letters, cijfers en streepjes bevatten." >&2
      exit 1
    fi
    upsert_env MOBILE_PROVISIONING_ENABLED true
    upsert_env MOBILE_REGION_ID "${region_id}"
    upsert_env MOBILE_REGION_NAME "${region_name}"
    upsert_env MOBILE_ACCESS_CODE_HASHES ""
    upsert_env MOBILE_PROFILE_PROTOCOLS "vless_reality,hysteria2,tuic"
    rm -f "${CODE_FILE}"
    systemctl restart amnion-backend
    echo "Mobiele provisioning is ingeschakeld voor ${region_name}."
    echo "De app vraagt alleen om een naam; er is geen toegangscode nodig."
    ;;
  disable)
    upsert_env MOBILE_PROVISIONING_ENABLED false
    rm -f "${CODE_FILE}"
    systemctl restart amnion-backend
    echo "Mobiele provisioning is uitgeschakeld. Bestaande Hiddify-profielen blijven werken."
    ;;
  status)
    grep -E '^MOBILE_(PROVISIONING_ENABLED|REGION_ID|REGION_NAME|PROFILE_PROTOCOLS)=' "${ENV_FILE}" || true
    ;;
  *)
    echo "Gebruik: $0 enable <regio-id> <regio-naam> | disable | status" >&2
    exit 1
    ;;
esac
