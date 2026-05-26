# Objective — M12 Basic Dynamic Behavior Builder

## Goal
Implement a visual rule builder for dynamic UI behavior: rules that show, hide, enable,
disable, mark required, or mark optional fields and sections based on conditions.

## P0 Feature Covered
Basic Dynamic Behavior Builder

## Build Scope
- BehaviorRuleListPanel (list all rules, add/remove/reorder)
- BehaviorRuleEditor (one rule: condition + target + effect)
- ConditionBuilder (condition types: role / field_value / workflow_state / record_mode / device)
- TargetSelector (target: field / section / tab / grid column / action)
- EffectSelector (effect: show / hide / enable / disable / required / optional / readonly / editable)
- MockRuleEvaluator (evaluates rules against simulation context)
- BehaviorSimulationPanel (set context, see which rules fire, see preview effects)

## Out of Scope
- Complex compound conditions (AND/OR trees — simplify to single condition per rule for P0)
- Real rules engine, server-side evaluation

## Hard Constraints
- Frontend only. Mock data only. Named exports only.
