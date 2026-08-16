import os
import warnings

import urllib3


def tls_verify() -> bool:
    """
    Windows Python 3.14 often cannot verify public HTTPS CAs
    (Vapi, OpenAI, WeatherAPI). Allow local override.
    """

    default = "false" if os.name == "nt" else "true"
    value = os.getenv("HTTPS_SSL_VERIFY", default).lower()
    return value not in ("0", "false", "no")


if not tls_verify():
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    warnings.filterwarnings("ignore", message="Unverified HTTPS request")
