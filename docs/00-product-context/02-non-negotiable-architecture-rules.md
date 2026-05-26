# Non-Negotiable Architecture Rules

1. EntityDefinition is the business object root and references child metadata by identity.
2. FieldDefinition is separate from EntityDefinition and does not define view layout.
3. ViewDefinition and RelationViewDefinition own presentation.
4. SecurityDefinition owns access decisions; hidden UI is not security.
5. Role affects security and experience, not structural schema ownership.
6. Compiler validation is mandatory before activation.
7. Runtime consumers receive resolved contracts, not raw authoring metadata.
8. Published versions are immutable and package-aware.
9. Destructive changes require dependency and migration checks.
10. PostgreSQL storage choices are derived from logical metadata and must not use ENUM for business picklists.
