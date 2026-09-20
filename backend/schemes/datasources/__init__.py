"""
DataSource factory — returns the right DataSource instance based on source type.
"""
from .base import DataSource
from .api_source import ExternalAPIDataSource

_REGISTRY: dict[str, type[DataSource]] = {
    "api": ExternalAPIDataSource,
}


def get_datasource(source_type: str = "api", **kwargs) -> DataSource:
    """
    Factory function.

    Args:
        source_type: Registered source type string ("api").
        **kwargs: Constructor arguments forwarded to the chosen DataSource class.

    Returns:
        An initialised DataSource instance.

    Raises:
        ValueError: If source_type is not registered.
    """
    cls = _REGISTRY.get(source_type.lower())
    if cls is None:
        available = ", ".join(_REGISTRY.keys())
        raise ValueError(
            f"Unknown source type '{source_type}'. Available: {available}"
        )
    return cls(**kwargs)


__all__ = ["DataSource", "ExternalAPIDataSource", "get_datasource"]

