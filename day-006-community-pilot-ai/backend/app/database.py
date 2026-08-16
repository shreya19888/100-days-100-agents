import os

import httpx
from dotenv import load_dotenv
from supabase import Client, ClientOptions, create_client

try:
    import certifi

    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
    os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())
except ImportError:
    pass


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured.")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY is not configured.")


# Windows Python often cannot verify supabase.co; disable SSL
# verification locally unless SUPABASE_SSL_VERIFY=true.
_verify_ssl = os.getenv(
    "SUPABASE_SSL_VERIFY",
    "false" if os.name == "nt" else "true",
).lower() not in ("0", "false", "no")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
    options=ClientOptions(
        httpx_client=httpx.Client(
            verify=_verify_ssl,
            timeout=30.0,
        )
    ),
)
