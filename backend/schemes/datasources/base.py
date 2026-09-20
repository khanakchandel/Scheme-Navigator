"""
Abstract base class for all scheme data sources.
To add a new data source (e.g. a live government API), subclass DataSource,
implement fetch_schemes(), and register it in the factory below.
"""
from abc import ABC, abstractmethod


class DataSource(ABC):
    """
    A DataSource provides a list of scheme dictionaries.
    Each dict must conform to the Scheme model field structure.
    """

    @abstractmethod
    def fetch_schemes(self) -> list[dict]:
        """
        Return a list of scheme dicts.
        Each dict must have at minimum: slug, name, category, level,
        short_description, detailed_description.
        """
        raise NotImplementedError
