"""A client library for accessing Malloy Publisher - Semantic Model Serving API"""

from .client import AuthenticatedClient, Client

__version__ = "0.1.0"

__all__ = (
    "AuthenticatedClient",
    "Client",
)
