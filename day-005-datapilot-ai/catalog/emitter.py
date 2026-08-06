from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.emitter.mce_builder import make_dataset_urn
from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.metadata.schema_classes import DatasetPropertiesClass

emitter = DatahubRestEmitter(gms_server="http://localhost:8080")


def emit_dataset(dataset):
    urn = make_dataset_urn(
        platform=dataset["platform"].lower(),
        name=dataset["name"].lower().replace(" ", "_"),
        env="PROD",
    )

    properties = DatasetPropertiesClass(
        name=dataset["name"],
        description=dataset["description"],
    )

    mcp = MetadataChangeProposalWrapper(
        entityUrn=urn,
        aspect=properties,
    )

    emitter.emit(mcp)

    print(f"✅ Emitted {dataset['name']}")