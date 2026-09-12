/**
 * Error coach (PRD CODE-06): translate common Python tracebacks into plain language.
 * Mission-specific explanations win; the generic table is the fallback. Works with no AI.
 */
import type { ErrorExplanation } from "@content/schema";

export interface CoachedError {
  title: string;
  explanation: string;
  errorType: string | null;
  line: number | null;
  source: "mission" | "generic" | "none";
}

interface GenericRule {
  match: RegExp;
  title: string;
  explanation: string;
}

export const GENERIC_RULES: GenericRule[] = [
  { match: /NameError: name '(\w+)' is not defined/, title: "Python has never heard of that name", explanation: "You used a name before giving it a value, or spelled it differently from where it was assigned. Check the spelling and make sure the assignment line runs before this one." },
  { match: /can only concatenate str \(not "int"\) to str|can only concatenate str \(not "float"\) to str/, title: "Text and numbers cannot be glued together directly", explanation: "You used + between a string and a number. Either convert the number with str(...) or build the text with an f-string: f\"Power: {total}\"." },
  { match: /unsupported operand type\(s\) for \+: 'int' and 'str'|unsupported operand type\(s\) for [+\-*/]+: '(?:int|float)' and 'str'/, title: "A number met a string in arithmetic", explanation: "One of the values is still text, probably because it came from a sensor or user input. Convert it with int(...) or float(...) before doing maths." },
  { match: /invalid literal for int\(\) with base 10/, title: "That text is not a whole number", explanation: "int() only accepts text that looks like a whole number, such as \"42\". Strip spaces first, or use float() if the text has a decimal point." },
  { match: /IndentationError|unexpected indent|expected an indented block/, title: "Indentation is part of the syntax", explanation: "Python uses the spaces at the start of a line to know which block the line belongs to. Lines inside a function or block need consistent indentation (4 spaces is the convention)." },
  { match: /SyntaxError: expected ':'|SyntaxError: invalid syntax/, title: "Python could not parse this line", explanation: "Look at the highlighted line and the one before it: a missing closing bracket, a missing colon at the end of a def or if line, or unbalanced quotes are the usual causes." },
  { match: /SyntaxError: unterminated string literal|EOL while scanning string literal/, title: "A string was opened but never closed", explanation: "Every opening quote needs a matching closing quote on the same line. Check for a missing \" or '." },
  { match: /IndexError: list index out of range|IndexError: string index out of range/, title: "That position does not exist", explanation: "Positions start at 0, so a collection with 3 items has positions 0, 1 and 2. Use len(...) to check the size, or a negative index like [-1] for the last item." },
  { match: /KeyError: (.+)/, title: "That key is not in the dictionary", explanation: "Square-bracket lookup crashes when a key is missing. Use .get(key, default) when the key might not exist, or check `key in registry` first." },
  { match: /'set' object is not subscriptable/, title: "Sets have no positions", explanation: "A set is unordered, so you cannot index it with [0]. Convert it with list(...) if you need positions, or just use `in` to test membership." },
  { match: /'tuple' object does not support item assignment/, title: "Tuples cannot be changed", explanation: "That is the point of a tuple: a fixed record. Build a new tuple if the value must change, or use a list if the data is meant to be edited." },
  { match: /'str' object does not support item assignment/, title: "Strings cannot be edited in place", explanation: "Strings are immutable. Build a new string with methods like .replace(...) or slicing and assign it back to the variable." },
  { match: /AttributeError: '(\w+)' object has no attribute '(\w+)'/, title: "That type has no such method", explanation: "The value is a different type from what you expected, so the method does not exist on it. Print type(value) to check, and look up the right method for that type." },
  { match: /unhashable type: 'list'|unhashable type: 'dict'/, title: "Only fixed values can go in a set or be dict keys", explanation: "Lists and dictionaries can change, so they cannot be hashed. Put strings, numbers or tuples in the set, or use them as keys instead." },
  { match: /TypeError: (\w+)\(\) missing (\d+) required positional argument/, title: "The function was called with too few arguments", explanation: "Compare the call with the def line: every parameter without a default needs a value." },
  { match: /TypeError: (\w+)\(\) takes (\d+) positional arguments? but (\d+) were given/, title: "The function was called with too many arguments", explanation: "Compare the call with the def line: the number of values passed must match the parameters." },
  { match: /TypeError: '(\w+)' object is not callable/, title: "You tried to call something that is not a function", explanation: "Round brackets call a function. If the name holds a value (a list, a string, a number), use square brackets to index it or drop the brackets." },
  { match: /ZeroDivisionError/, title: "Division by zero", explanation: "The divisor was 0. Guard the calculation or check where the zero came from." },
  { match: /ValueError: not enough values to unpack|ValueError: too many values to unpack/, title: "Unpacking count does not match", explanation: "The number of names on the left must equal the number of items on the right: name, lat, lon = sensor needs exactly three items." },
  { match: /RecursionError/, title: "A function kept calling itself", explanation: "Each call needs a way to stop. Check the base case." },
];

export function coachError(
  traceback: string | null | undefined,
  errorType: string | null | undefined,
  line: number | null | undefined,
  missionRules: readonly ErrorExplanation[] = [],
): CoachedError {
  if (!traceback) return { title: "", explanation: "", errorType: null, line: null, source: "none" };
  for (const r of missionRules) {
    let re: RegExp | null = null;
    try {
      re = new RegExp(r.match);
    } catch {
      re = null;
    }
    if (re ? re.test(traceback) : traceback.includes(r.match)) {
      return { title: r.title, explanation: r.explanation, errorType: errorType ?? null, line: line ?? null, source: "mission" };
    }
  }
  for (const r of GENERIC_RULES) {
    if (r.match.test(traceback)) return { title: r.title, explanation: r.explanation, errorType: errorType ?? null, line: line ?? null, source: "generic" };
  }
  return {
    title: errorType ? `${errorType} on line ${line ?? "?"}` : "Something went wrong",
    explanation: "Read the last line of the traceback first: it names the error and what Python was trying to do. Then find the line number and read that line slowly.",
    errorType: errorType ?? null,
    line: line ?? null,
    source: "generic",
  };
}
