"""Custom exception classes."""

from fastapi import HTTPException, status


class JoutatsuException(Exception):
    """Base exception for Joutatsu application."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class NotFoundError(JoutatsuException):
    """Resource not found error."""

    pass


class ValidationError(JoutatsuException):
    """Validation error."""

    pass


class AnkiConnectionError(JoutatsuException):
    """AnkiConnect connection error."""

    pass


class DictionaryError(JoutatsuException):
    """Dictionary lookup error."""

    pass


def not_found_exception(detail: str = "Resource not found") -> HTTPException:
    """Create HTTP 404 exception."""
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def bad_request_exception(detail: str = "Bad request") -> HTTPException:
    """Create HTTP 400 exception."""
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def service_unavailable_exception(detail: str = "Service unavailable") -> HTTPException:
    """Create HTTP 503 exception."""
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
