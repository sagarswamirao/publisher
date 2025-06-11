from collections.abc import Mapping
from typing import (
    Any,
    TypeVar,
    Union,
    cast,
)

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="Query")


@_attrs_define
class Query:
    """Named model query.

    Attributes:
        name (Union[Unset, str]): Query's name.
        source_name (Union[Unset, str]): Source name.
        annotations (Union[Unset, list[str]]): Annotations attached to query.
    """

    name: Union[Unset, str] = UNSET
    source_name: Union[Unset, str] = UNSET
    annotations: Union[Unset, list[str]] = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        source_name = self.source_name

        annotations: Union[Unset, list[str]] = UNSET
        if not isinstance(self.annotations, Unset):
            annotations = self.annotations

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if name is not UNSET:
            field_dict["name"] = name
        if source_name is not UNSET:
            field_dict["sourceName"] = source_name
        if annotations is not UNSET:
            field_dict["annotations"] = annotations

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        name = d.pop("name", UNSET)

        source_name = d.pop("sourceName", UNSET)

        annotations = cast(list[str], d.pop("annotations", UNSET))

        query = cls(
            name=name,
            source_name=source_name,
            annotations=annotations,
        )

        query.additional_properties = d
        return query

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
