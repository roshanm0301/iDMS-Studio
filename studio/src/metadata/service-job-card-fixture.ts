import type { MetadataSet } from './compiler';
import {
  customerEntity,
  customerVehicleFields,
  serviceJobCardEntity,
  serviceJobCardFields,
  serviceJobCardRelationships,
  vehicleEntity,
} from './core-fixtures';
import {
  serviceJobCardDependencies,
  serviceJobCardPackage,
  serviceJobCardSecurityDefinitions,
  serviceJobCardValidationRules,
  serviceJobCardVersions,
} from './policy-version-fixtures';

export const serviceJobCardMetadataSet: MetadataSet = {
  entities: [customerEntity, vehicleEntity, serviceJobCardEntity],
  fields: [...customerVehicleFields, ...serviceJobCardFields],
  relationships: serviceJobCardRelationships,
  validationRules: serviceJobCardValidationRules,
  securityDefinitions: serviceJobCardSecurityDefinitions,
  actions: [],
  views: [],
  versions: serviceJobCardVersions,
  dependencies: serviceJobCardDependencies,
  packages: [serviceJobCardPackage],
};
