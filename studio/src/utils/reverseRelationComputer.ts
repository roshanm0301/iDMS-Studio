// ============================================================
// Reverse Relation Computer
// Auto-discovers "which entities reference this entity" by
// scanning all entity_ref fields across the entity graph.
// No manual registration needed.
// ============================================================
import type { EntityDefinition, ReverseRelation } from '../types/entityDesigner';

/**
 * Scans `allEntities` and returns all entity_ref fields
 * that point to `targetEntityType`.
 * Called in FieldInspector (entity-level view) to show
 * "Entities that reference this entity".
 */
export function computeReverseRelations(
  targetEntityType: string,
  allEntities: EntityDefinition[],
): ReverseRelation[] {
  const result: ReverseRelation[] = [];

  for (const entity of allEntities) {
    for (const field of entity.fields) {
      if (
        field.fieldType === 'entity_ref' &&
        field.typeConfig?.targetEntity === targetEntityType
      ) {
        result.push({
          sourceEntity: entity.entityType,
          sourceEntityLabel: entity.label,
          sourceField: field.fieldId,
          sourceFieldLabel: field.label,
          // Default: transaction entities show sub-panels; others don't
          showInPanel: entity.category === 'transaction',
        });
      }
    }
  }

  return result;
}
