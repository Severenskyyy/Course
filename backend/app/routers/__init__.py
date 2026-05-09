"""
Роутеры API библиотечной системы АБИС
"""
from . import auth
from . import books
from . import readers
from . import loans
from . import reservations
from . import reports
from . import notifications
from . import import_export

__all__ = [
    "auth",
    "books", 
    "readers",
    "loans",
    "reservations",
    "reports",
    "notifications",
    "import_export"
]
