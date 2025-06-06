from collections.abc import Mapping
from typing import (
    Any,
    TypeVar,
    Union,
)

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="Notebook")


@_attrs_define
class Notebook:
    """Malloy Notebook metadata

    Attributes:
        resource (Union[Unset, str]): Resource path to the notebook.
        package_name (Union[Unset, str]): Notebook's package Name
        path (Union[Unset, str]): Notebook's relative path in its package directory.
    """

    resource: Union[Unset, str] = UNSET
    package_name: Union[Unset, str] = UNSET
    path: Union[Unset, str] = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        resource = self.resource

        package_name = self.package_name

        path = self.path

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if resource is not UNSET:
            field_dict["resource"] = resource
        if package_name is not UNSET:
            field_dict["packageName"] = package_name
        if path is not UNSET:
            field_dict["path"] = path

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        resource = d.pop("resource", UNSET)

        package_name = d.pop("packageName", UNSET)

        path = d.pop("path", UNSET)

        notebook = cls(
            resource=resource,
            package_name=package_name,
            path=path,
        )

        notebook.additional_properties = d
        return notebook

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
