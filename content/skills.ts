import type { SkillInput } from "./schema";

/**
 * Skill catalogue. Anchors are one-line mental models (PRD §9).
 * Worlds 1–2 skills are fully exercised; later skills exist so locked worlds can reference them.
 */
export const skills: SkillInput[] = [
  // World 1 — Foundation District
  { id: "variables", name: "Variables", domain: "core", anchor: "Variable = a labelled slot for a value", description: "Name a value so the world can refer to it later. Assignment with =, reassignment, naming rules." },
  { id: "numeric-types", name: "Numbers: int and float", domain: "core", anchor: "int = whole count, float = measurement", description: "Whole numbers vs decimals, and why 10 / 2 gives 5.0.", prerequisites: ["variables"] },
  { id: "operators", name: "Arithmetic operators", domain: "core", anchor: "// keeps the whole, % keeps the remainder", description: "+ - * / // % ** and operator precedence, applied to capacity and scheduling maths.", prerequisites: ["numeric-types"] },
  { id: "strings", name: "Strings", domain: "core", anchor: "String = a sequence of characters", description: "Text values, quotes, concatenation, common methods like upper(), strip(), replace().", prerequisites: ["variables"] },
  { id: "f-strings", name: "f-strings", domain: "core", anchor: "f\"...{value}...\" = text with values baked in", description: "Formatted string literals for building readable output.", prerequisites: ["strings"] },
  { id: "string-indexing", name: "Indexing and slicing", domain: "core", anchor: "text[start:stop] = a slice, stop is exclusive", description: "Positions start at 0, negative indexes count from the end, slices copy a range, split() breaks on a separator.", prerequisites: ["strings"] },
  { id: "type-conversion", name: "Type conversion", domain: "core", anchor: "int(), str(), float() = change the type on purpose", description: "Why 'Power: ' + 42 crashes and how to convert between text and numbers.", prerequisites: ["strings", "numeric-types"] },

  // World 2 — Data Vault
  { id: "lists", name: "Lists", domain: "data", anchor: "List = an ordered sequence you can change", description: "Ordered, mutable collections: append, index, slice, len, in.", prerequisites: ["string-indexing"] },
  { id: "sets", name: "Sets", domain: "data", anchor: "Set = uniqueness and fast membership", description: "Unordered collections with no duplicates; set(), add, in, and set operations.", prerequisites: ["lists"] },
  { id: "dicts", name: "Dictionaries", domain: "data", anchor: "Dictionary = lookup by key", description: "Key → value maps: literal syntax, [] and .get(), keys(), values(), items(), update.", prerequisites: ["lists"] },
  { id: "tuples", name: "Tuples", domain: "data", anchor: "Tuple = a fixed record", description: "Immutable sequences for records that must not change; unpacking.", prerequisites: ["lists"] },
  { id: "collections-ops", name: "Working with nested collections", domain: "data", anchor: "Pick the structure by how you will look things up", description: "Lists of dicts, membership tests, counting, sorting, choosing list vs set vs dict vs tuple.", prerequisites: ["sets", "dicts", "tuples"] },

  // World 3+ (referenced by locked previews)
  { id: "conditions", name: "Conditions", domain: "control", anchor: "Condition = decision", description: "if / elif / else and comparison operators.", prerequisites: ["variables"] },
  { id: "boolean-logic", name: "Boolean logic", domain: "control", anchor: "and, or, not = combine decisions", description: "Truthiness, and/or/not, short-circuit evaluation.", prerequisites: ["conditions"] },
  { id: "for-loops", name: "for loops", domain: "control", anchor: "Loop = repetition", description: "Iterate over sequences and ranges.", prerequisites: ["lists"] },
  { id: "while-loops", name: "while loops", domain: "control", anchor: "while = repeat until a condition changes", description: "Condition-driven loops, break and continue.", prerequisites: ["for-loops", "conditions"] },
  { id: "comprehensions", name: "Comprehensions", domain: "control", anchor: "Comprehension = build a collection in one expression", description: "List, set and dict comprehensions.", prerequisites: ["for-loops"] },
  { id: "functions", name: "Functions", domain: "functions", anchor: "Function = reusable machine", description: "def, parameters, return values, scope.", prerequisites: ["for-loops"] },
  { id: "arguments", name: "Arguments and defaults", domain: "functions", anchor: "Defaults = sensible behaviour unless told otherwise", description: "Positional, keyword and default arguments; *args and **kwargs basics.", prerequisites: ["functions"] },
  { id: "exceptions", name: "Exceptions", domain: "errors", anchor: "Exception = controlled failure", description: "try / except / finally, raising, custom exceptions.", prerequisites: ["functions"] },
  { id: "validation", name: "Validation", domain: "errors", anchor: "Validate at the boundary, trust inside", description: "Defensive programming and input checks.", prerequisites: ["exceptions"] },
  { id: "files", name: "Files and paths", domain: "files", anchor: "with open(...) = borrow the file, return it automatically", description: "Reading and writing files, pathlib.", prerequisites: ["exceptions"] },
  { id: "json", name: "JSON", domain: "files", anchor: "JSON = dictionaries that travel", description: "Serialising and parsing JSON.", prerequisites: ["dicts", "files"] },
  { id: "http", name: "HTTP basics", domain: "network", anchor: "API = systems talking", description: "Requests, responses, status codes, headers.", prerequisites: ["json"] },
  { id: "api-calls", name: "Calling APIs", domain: "network", anchor: "Check the status before you trust the body", description: "Making requests with httpx, handling failures.", prerequisites: ["http"] },
  { id: "classes", name: "Classes and objects", domain: "oop", anchor: "Class = blueprint, object = instance", description: "Defining classes, __init__, methods, attributes.", prerequisites: ["functions", "dicts"] },
  { id: "composition", name: "Composition", domain: "oop", anchor: "Compose objects instead of inheriting everything", description: "Building systems out of smaller objects.", prerequisites: ["classes"] },
  { id: "type-hints", name: "Type hints", domain: "oop", anchor: "Type hint = a promise the tools can check", description: "Annotating functions and classes.", prerequisites: ["classes"] },
  { id: "modules", name: "Modules and packages", domain: "runtime", anchor: "Module = a file you can import", description: "import, packages, structuring a project.", prerequisites: ["functions"] },
  { id: "environments", name: "Virtual environments and pip", domain: "runtime", anchor: "One project, one environment", description: "venv, pip, requirements, environment variables.", prerequisites: ["modules"] },
  { id: "async", name: "async / await", domain: "async", anchor: "Async = do useful work while waiting", description: "Coroutines, event loop, gathering I/O-bound tasks.", prerequisites: ["functions", "api-calls"] },
  { id: "pydantic", name: "Pydantic models", domain: "services", anchor: "Model = validated shape of data", description: "Declaring and validating data models.", prerequisites: ["type-hints", "json"] },
  { id: "fastapi", name: "FastAPI", domain: "services", anchor: "Route = a function exposed to the network", description: "Building validated HTTP APIs.", prerequisites: ["pydantic", "async"] },
  { id: "logging", name: "Logging", domain: "services", anchor: "Log = the story the system tells later", description: "The logging module and structured logs.", prerequisites: ["modules"] },
  { id: "testing", name: "Testing", domain: "services", anchor: "Test = a promise checked by a machine", description: "pytest basics.", prerequisites: ["functions"] },
  { id: "git", name: "Git", domain: "deploy", anchor: "Commit = a named snapshot", description: "Practical version control.", prerequisites: ["modules"] },
  { id: "docker", name: "Docker", domain: "deploy", anchor: "Container = the app and its environment, boxed", description: "Dockerfile, images, containers.", prerequisites: ["environments"] },
  { id: "llm-apis", name: "LLM APIs", domain: "ai", anchor: "Prompt in, structured output out", description: "Calling a model, prompts, structured outputs.", prerequisites: ["api-calls", "pydantic"] },
  { id: "rag", name: "Retrieval-augmented generation", domain: "ai", anchor: "Retrieve, then generate, then cite", description: "Chunking, embeddings, retrieval, citations.", prerequisites: ["llm-apis"] },
  { id: "agents", name: "Tools and agents", domain: "ai", anchor: "Agent = a loop with tools and guardrails", description: "Tool calling, bounded agents, evaluation.", prerequisites: ["rag"] },
];
