export type {
  ValidatableProphecyInput,
} from "./logic/validation";

export type {
  CopyStatus,
  CopyStatusState,
  CopyErrorStatus,
  CopyIdleStatus,
  CopySuccessStatus,
  FieldName,
  Gender,
  LineVocabularyProfile,
  PromptMeta,
  ProphecyInput,
  ProphecyResult,
  ProphecyWeek,
  SelectedLine,
  SelectedLineTerms,
  TemplateLineCandidate,
  TemplateLineCandidateMeta,
  TemplateLineCandidateRef,
  TemplateLineCatalog,
  TemplateLineKey,
  TemplateLineMeta,
  ValidationErrors,
  ValidationResult,
  VocabularyCategory,
  VocabularyPromptMeta,
  WeekNumber,
} from "./types";

export { genderOptions, inputMaxLengths, moodSuggestions } from "./constants/input";
export { lineMetaByKey, templateLineCatalog } from "./constants/templateLines";
export { vocabularyProfiles, vocabularyPromptMeta } from "./constants/vocabulary";
export { createRandom, generateSeed } from "./logic/random";
export type { Random } from "./logic/random";
export { buildAiPrompt, buildInterpretationAxis, generateProphecy } from "./logic/generation";
export { validateInput } from "./logic/validation";
