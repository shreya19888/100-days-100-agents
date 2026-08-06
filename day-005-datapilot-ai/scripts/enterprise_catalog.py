from catalog.datasets import DATASETS
from catalog.emitter import emit_dataset

print("🚀 Creating Enterprise Catalog...\n")

for dataset in DATASETS:
    emit_dataset(dataset)

print("\n🎉 Finished!")