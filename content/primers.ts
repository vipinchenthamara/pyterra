import type { Primer } from "./schema";

/**
 * Skill primers: the "Learn" step shown before the first mission that uses a skill.
 * Free of charge (no hint penalty). Each note is one idea + a runnable snippet + its output.
 * Voice: problem first, world framing, no textbook definitions. See docs/authoring-guide.md.
 */
export const primers: Record<string, Primer> = {
  variables: {
    intro:
      "The district cannot report its own state because nothing in it has a name. A variable is how you give a value a name so the rest of the world can refer to it: the control room asks for `power_level` and gets whatever number you stored there.",
    notes: [
      {
        title: "Name a value with =",
        body: "The name goes on the left, the value on the right. From then on the name stands in for the value.",
        code: "district_name = \"Foundation District\"\nprint(district_name)",
        output: "Foundation District",
      },
      {
        title: "Reassign to change it",
        body: "Assigning again replaces the old value. The most recent assignment wins.",
        code: "power_level = 25\npower_level = 40\nprint(power_level)",
        output: "40",
      },
      {
        title: "Names are case-sensitive and cannot have spaces",
        body: "Use lowercase words joined with underscores. `Power_Level` and `power_level` are two different names.",
        code: "core_online = True\nprint(core_online)",
        output: "True",
      },
    ],
    takeaway: "A variable is a labelled slot: put a value in, refer to it by name later.",
  },
  operators: {
    intro:
      "Capacity maths is where a spreadsheet mindset breaks: dividing 26 hours into 8-hour shifts gives you 3.25, but you cannot roster a quarter of a crew. Python has separate operators for the real division, the whole-number count, and the remainder, and each answers a different operations question.",
    notes: [
      {
        title: "/ always gives a decimal",
        body: "Even when it divides evenly, the result is a float. Use it when you want the true fraction.",
        code: "print(415 / 640 * 100)\nprint(640 / 2)",
        output: "64.84375\n320.0",
      },
      {
        title: "// keeps the whole, % keeps the remainder",
        body: "Floor division counts how many complete groups fit. Modulo is what is left over after those groups are taken out. Together they always rebuild the original.",
        code: "print(26 // 8)\nprint(26 % 8)\nprint(3 * 8 + 2)",
        output: "3\n2\n26",
      },
      {
        title: "Precedence works like maths",
        body: "* and / run before + and -. Use brackets when the order matters, which in operations maths is almost always.",
        code: "print(640 - 415 * 1)\nprint((640 - 415) / 640)",
        output: "225\n0.3515625",
      },
    ],
    takeaway: "/ for the fraction, // for how many whole ones fit, % for what is left over.",
  },
  // -------------------------------------------------------------------------
  // World 1 — Foundation District
  // -------------------------------------------------------------------------
  "numeric-types": {
    intro:
      "The district's meters report two kinds of number: a count of nodes online, which is never 3.5, and a load reading like 71.25 percent, which almost never lands on a whole. Python keeps them as two different types, and some maths quietly turns one into the other, which is how a clean 40 ends up printed as 40.0 on the status board.",
    notes: [
      {
        title: "Whole numbers are int",
        body: "Anything you count is an int. type() tells you what kind of value a name holds.",
        code: "nodes_online = 40\nprint(nodes_online)\nprint(type(nodes_online))",
        output: "40\n<class 'int'>",
      },
      {
        title: "Decimals are float",
        body: "Anything you measure is a float. The decimal point is what marks it, even when it is .0.",
        code: "load = 71.25\nprint(load)\nprint(type(load))",
        output: "71.25\n<class 'float'>",
      },
      {
        title: "/ always gives a float",
        body: "Even when the division is exact, the result carries a decimal point. 80 nodes split across 2 racks is 40.0, not 40.",
        code: "print(80 / 2)",
        output: "40.0",
      },
      {
        title: "Mixing int and float gives float",
        body: "One float anywhere in the sum makes the whole result a float. Python widens rather than losing the fraction.",
        code: "print(40 + 0.5)\nprint(2 * 1.5)",
        output: "40.5\n3.0",
      },
    ],
    takeaway: "int for things you count, float for things you measure, and any / or float in the maths makes the result a float.",
  },
  strings: {
    intro:
      "Every hostname, alert message and badge id in the district arrives as text, and the feeds spell it every way imaginable: capitals, stray spaces, mixed separators. Text needs different handling from numbers: you join it, clean it and change its case, and Python gives text values built-in methods so the routine clean-up is one call instead of a manual edit.",
    notes: [
      {
        title: "Quotes make text",
        body: "Double or single quotes both work; the value is a string either way. Pick one style and stay with it.",
        code: "host = \"edge-fw-01\"\nzone = 'dmz'\nprint(host)\nprint(zone)",
        output: "edge-fw-01\ndmz",
      },
      {
        title: "+ joins strings, it does not add them",
        body: "Concatenation glues text end to end. Two strings of digits join as text, so \"1\" + \"2\" is \"12\", never 3.",
        code: "prefix = \"SEC-\"\nprint(prefix + \"042\")\nprint(\"1\" + \"2\")",
        output: "SEC-042\n12",
      },
      {
        title: "Methods clean and reshape",
        body: "A method hangs off the value with a dot. strip() removes surrounding whitespace, lower() folds case, and they chain left to right.",
        code: "raw = \"  EDGE-FW-01  \"\nprint(raw.strip().lower())",
        output: "edge-fw-01",
      },
      {
        title: "Methods return a new string",
        body: "The original is never edited in place. upper() and replace() hand back a changed copy; the name still holds what it held.",
        code: "host = \"edge-fw-01\"\nprint(host.upper())\nprint(host.replace(\"-\", \"_\"))\nprint(host)",
        output: "EDGE-FW-01\nedge_fw_01\nedge-fw-01",
      },
    ],
    takeaway: "A string is text in quotes: + joins it, and methods like strip(), lower() and replace() hand back a cleaned copy.",
  },
  "f-strings": {
    intro:
      "The control room's status line reads \"Power: 40 of 64 nodes\" and the numbers change every minute. Building that line with + means converting every number to text by hand and getting the spaces wrong; an f-string lets you write the sentence once and drop the live values into it.",
    notes: [
      {
        title: "Put f before the quote, values in braces",
        body: "Anything inside the braces is evaluated and its text is dropped into the sentence. Numbers need no conversion.",
        code: "nodes = 40\nprint(f\"Power: {nodes} nodes online\")",
        output: "Power: 40 nodes online",
      },
      {
        title: "Any expression goes in the braces",
        body: "Maths, method calls, anything that produces a value. The calculation happens as the string is built.",
        code: "online = 40\ntotal = 64\nprint(f\"{online} of {total} ({online / total * 100}%)\")",
        output: "40 of 64 (62.5%)",
      },
      {
        title: "A format spec rounds for the report",
        body: "After the value, a colon and a spec: .1f means a float with one decimal place. The stored value is untouched; only the printed text is rounded.",
        code: "load = 415 / 640 * 100\nprint(f\"Load: {load:.1f}%\")",
        output: "Load: 64.8%",
      },
      {
        title: "Without the f, braces are just text",
        body: "The f is the switch. Leave it off and Python prints the braces and the name literally, which is the most common f-string bug.",
        code: "nodes = 40\nprint(\"Power: {nodes}\")\nprint(f\"Power: {nodes}\")",
        output: "Power: {nodes}\nPower: 40",
      },
    ],
    takeaway: "An f-string is the sentence with the live values in braces: f\"Power: {nodes}\".",
  },
  "string-indexing": {
    intro:
      "Telemetry arrives packed: SEC-042-CRIT is three fields in one string, and the tower needs each one on its own to page the right team. You do not read it by eye; you cut it by position, and the same cut then works on every code in that format.",
    notes: [
      {
        title: "Positions start at 0",
        body: "The first character is at position 0, not 1. The dash takes a slot of its own, so the 0 of 042 sits at position 4.",
        code: "signal = \"SEC-042-CRIT\"\nprint(signal[0])\nprint(signal[4])",
        output: "S\n0",
      },
      {
        title: "A slice copies from start up to, not including, stop",
        body: "text[4:7] gives positions 4, 5 and 6. The stop is exclusive, which is why a three-character field is [4:7] and not [4:6].",
        code: "signal = \"SEC-042-CRIT\"\nprint(signal[0:3])\nprint(signal[4:7])",
        output: "SEC\n042",
      },
      {
        title: "Leave an edge off, or count from the end",
        body: "An empty start means from the beginning, an empty stop means to the end. A negative position counts back from the end, so -1 is the last character.",
        code: "signal = \"SEC-042-CRIT\"\nprint(signal[:3])\nprint(signal[8:])\nprint(signal[-1])",
        output: "SEC\nCRIT\nT",
      },
      {
        title: "len counts every character",
        body: "Dashes included. Two codes in the same format have the same length, which is what makes the same cuts work on both.",
        code: "signal = \"SEC-042-CRIT\"\nprint(len(signal))\nprint(len(\"NET-117-WARN\"))",
        output: "12\n12",
      },
    ],
    takeaway: "text[start:stop] copies from start up to but not including stop, and positions begin at 0.",
  },
  "type-conversion": {
    intro:
      "The meter reports \"73\" and the district wants to add the 12 reserve nodes to it. Python refuses: \"73\" is text and 12 is a number, and it will not guess which one you meant. Conversion is you saying it out loud, int() to make a number and str() to make text, before the two are ever mixed.",
    notes: [
      {
        title: "Text and numbers do not mix",
        body: "\"73\" + 12 raises TypeError: can only concatenate str (not \"int\") to str. Two strings do join, but they join as text: \"73\" + \"12\" is \"7312\", not 85.",
        code: "reading = \"73\"\nprint(reading + \"12\")",
        output: "7312",
      },
      {
        title: "int() turns text into a whole number",
        body: "Once converted, the value adds like any other int. The text must look like a whole number, or int() raises ValueError.",
        code: "reading = \"73\"\nprint(int(reading) + 12)",
        output: "85",
      },
      {
        title: "str() turns a number into text",
        body: "Now + is concatenation on both sides and the label builds cleanly. f-strings do this conversion for you, which is why they are usually the better tool.",
        code: "nodes = 40\nprint(\"Nodes: \" + str(nodes))",
        output: "Nodes: 40",
      },
      {
        title: "float() for decimals, and int() drops the fraction",
        body: "int() truncates, it does not round: 3.9 becomes 3. int(\"71.25\") fails because the text is not a whole number, so go through float() first.",
        code: "print(float(\"71.25\"))\nprint(int(3.9))\nprint(int(float(\"71.25\")))",
        output: "71.25\n3\n71",
      },
    ],
    takeaway: "Python never guesses a type: say int(), float() or str() yourself before mixing text and numbers.",
  },

  // -------------------------------------------------------------------------
  // World 2 — Data Vault
  // -------------------------------------------------------------------------
  lists: {
    intro:
      "The vault's first job is a register of every asset the district owns, in the order it was registered, and it grows every time a new host comes online. One variable holds one value; a list holds a whole sequence under one name and lets you add to it, count it and look up any position.",
    notes: [
      {
        title: "Square brackets, comma-separated",
        body: "The order you write is the order the list keeps. len() counts the items.",
        code: "hosts = [\"fw-01\", \"vpn-02\", \"db-03\"]\nprint(hosts)\nprint(len(hosts))",
        output: "['fw-01', 'vpn-02', 'db-03']\n3",
      },
      {
        title: "Index and slice like a string",
        body: "Position 0 is the first item, -1 the last, and a slice copies a range with the stop excluded, exactly as it did for text.",
        code: "hosts = [\"fw-01\", \"vpn-02\", \"db-03\"]\nprint(hosts[0])\nprint(hosts[-1])\nprint(hosts[:2])",
        output: "fw-01\ndb-03\n['fw-01', 'vpn-02']",
      },
      {
        title: "append adds to the end, in place",
        body: "The list itself changes; nothing is returned. Writing hosts = hosts.append(...) throws the list away and leaves you holding None.",
        code: "hosts = [\"fw-01\", \"vpn-02\"]\nhosts.append(\"db-03\")\nprint(hosts)",
        output: "['fw-01', 'vpn-02', 'db-03']",
      },
      {
        title: "in asks whether something is present",
        body: "The answer is True or False. It is the register's \"is it there?\" question in one operator.",
        code: "hosts = [\"fw-01\", \"vpn-02\", \"db-03\"]\nprint(\"vpn-02\" in hosts)\nprint(\"idp-04\" in hosts)",
        output: "True\nFalse",
      },
    ],
    takeaway: "A list is an ordered, changeable sequence: index by position, append to grow, in to check membership.",
  },
  sets: {
    intro:
      "Forty identical alerts fire in a storm and the incident board should show one line, not forty. A list keeps every duplicate faithfully; a set keeps each value once, and answers \"have I seen this?\" instantly no matter how big it grows.",
    notes: [
      {
        title: "set() collapses duplicates",
        body: "Feed it a list and every repeat disappears. A set has no order of its own, so print sorted(...) when you need a stable listing.",
        code: "alerts = [\"disk-full\", \"cpu-high\", \"disk-full\", \"disk-full\"]\nunique = set(alerts)\nprint(len(unique))\nprint(sorted(unique))",
        output: "2\n['cpu-high', 'disk-full']",
      },
      {
        title: "add ignores what is already there",
        body: "Adding a value the set already holds changes nothing. That is the whole point: no bookkeeping to avoid duplicates.",
        code: "seen = {\"fw-01\"}\nseen.add(\"fw-01\")\nseen.add(\"vpn-02\")\nprint(sorted(seen))",
        output: "['fw-01', 'vpn-02']",
      },
      {
        title: "in is the fast question",
        body: "Membership on a set does not scan; it is a direct lookup. A blocklist of a million addresses answers as fast as one of ten.",
        code: "blocked = {\"10.0.0.7\", \"10.0.0.9\"}\nprint(\"10.0.0.7\" in blocked)\nprint(\"10.0.0.8\" in blocked)",
        output: "True\nFalse",
      },
      {
        title: "Set arithmetic compares inventories",
        body: "- gives what is in the first but not the second; & gives what is in both. Reconciling the CMDB against a scan is two operators.",
        code: "cmdb = {\"fw-01\", \"vpn-02\", \"db-03\"}\nscanned = {\"vpn-02\", \"db-03\", \"ghost-99\"}\nprint(sorted(cmdb - scanned))\nprint(sorted(cmdb & scanned))",
        output: "['fw-01']\n['db-03', 'vpn-02']",
      },
    ],
    takeaway: "A set keeps each value once, forgets order, and answers in instantly.",
  },
  dicts: {
    intro:
      "The register can say whether fw-01 exists, but operators ask \"what is fw-01?\", and scanning a list for the answer is slow and one typo away from a crash. A dictionary pairs each key with a value so the lookup is one step, and .get lets a missing key return a calm default instead of taking the console down.",
    notes: [
      {
        title: "Braces, key: value",
        body: "Look a value up by putting its key in square brackets. len() counts the pairs.",
        code: "registry = {\"fw-01\": \"Perimeter firewall\", \"vpn-02\": \"Remote access VPN\"}\nprint(registry[\"fw-01\"])\nprint(len(registry))",
        output: "Perimeter firewall\n2",
      },
      {
        title: "Assigning to a key adds or replaces it",
        body: "A new key is added at the end; an existing key gets its value overwritten. Insertion order is kept.",
        code: "registry = {\"fw-01\": \"Perimeter firewall\"}\nregistry[\"idp-03\"] = \"Identity provider\"\nprint(registry)",
        output: "{'fw-01': 'Perimeter firewall', 'idp-03': 'Identity provider'}",
      },
      {
        title: ".get returns a default instead of crashing",
        body: "registry[\"ghost-99\"] raises KeyError: 'ghost-99' and stops the program. .get(key, default) hands back the default when the key is missing and never raises.",
        code: "registry = {\"fw-01\": \"Perimeter firewall\"}\nprint(registry.get(\"fw-01\", \"unknown asset\"))\nprint(registry.get(\"ghost-99\", \"unknown asset\"))",
        output: "Perimeter firewall\nunknown asset",
      },
      {
        title: "keys, values, and in",
        body: "keys() and values() list each side; in checks the keys only, never the values.",
        code: "registry = {\"fw-01\": \"Perimeter firewall\", \"vpn-02\": \"Remote access VPN\"}\nprint(sorted(registry.keys()))\nprint(list(registry.values()))\nprint(\"vpn-02\" in registry)",
        output: "['fw-01', 'vpn-02']\n['Perimeter firewall', 'Remote access VPN']\nTrue",
      },
    ],
    takeaway: "A dictionary is a lookup by key: [] when the key must exist, .get(key, default) when it might not.",
  },
  tuples: {
    intro:
      "A firewall rule is a record: source, port, action, three fields that belong together and must not be edited by a stray append halfway through an audit. A tuple is the fixed version of a list: once built it cannot change, which is exactly what a record wants, and Python can unpack its fields straight into names.",
    notes: [
      {
        title: "Round brackets make a fixed record",
        body: "Index it like a list. But there is no append, and rule[1] = 80 raises TypeError: 'tuple' object does not support item assignment.",
        code: "rule = (\"10.0.0.7\", 443, \"allow\")\nprint(rule)\nprint(rule[1])",
        output: "('10.0.0.7', 443, 'allow')\n443",
      },
      {
        title: "Unpack into names",
        body: "One name per field, in order. This is how a record stops being rule[0], rule[1], rule[2] and starts being source, port, action.",
        code: "rule = (\"10.0.0.7\", 443, \"allow\")\nsource, port, action = rule\nprint(f\"{action} {source} on {port}\")",
        output: "allow 10.0.0.7 on 443",
      },
      {
        title: "A function returns several values as one tuple",
        body: "Return a tuple and the caller unpacks it. Two results travel as one record.",
        code: "def split_host(fqdn):\n    return (fqdn[:5], fqdn[6:])\nname, zone = split_host(\"fw-01.corp\")\nprint(name)\nprint(zone)",
        output: "fw-01\ncorp",
      },
      {
        title: "A one-item tuple needs a trailing comma",
        body: "(443) is just the number 443 in brackets. (443,) is a tuple holding one value. The comma makes the tuple, not the brackets.",
        code: "single = (443,)\nnot_a_tuple = (443)\nprint(len(single))\nprint(not_a_tuple)",
        output: "1\n443",
      },
    ],
    takeaway: "A tuple is a list that cannot change: use it for records, and unpack it into named fields.",
  },
  "collections-ops": {
    intro:
      "Real vault data is nested: a list of hosts, each one a dictionary with a name, a zone and a score. The questions ops ask, how many are in the DMZ, which zones exist, what is the top score, each want a different structure, and choosing by how you will look things up is most of the job.",
    notes: [
      {
        title: "A list of dicts: index the record, then the key",
        body: "hosts[1] is the second record; [\"name\"] then reads one field from it. Two lookups, left to right.",
        code: "hosts = [{\"name\": \"fw-01\", \"zone\": \"dmz\"}, {\"name\": \"db-03\", \"zone\": \"core\"}]\nprint(hosts[1][\"name\"])\nprint(len(hosts))",
        output: "db-03\n2",
      },
      {
        title: "count and sorted answer the routine questions",
        body: "count() tallies one value, sorted() gives an ordered copy, and sorted(set(...)) gives the distinct values in order.",
        code: "zones = [\"dmz\", \"core\", \"dmz\", \"dmz\"]\nprint(zones.count(\"dmz\"))\nprint(sorted(zones))\nprint(sorted(set(zones)))",
        output: "3\n['core', 'dmz', 'dmz', 'dmz']\n['core', 'dmz']",
      },
      {
        title: "min, max and items() on a dictionary",
        body: "values() feeds the numbers to min or max; items() gives (key, value) pairs you can sort as records.",
        code: "scores = {\"fw-01\": 7, \"db-03\": 9, \"vpn-02\": 4}\nprint(max(scores.values()))\nprint(sorted(scores.items()))",
        output: "9\n[('db-03', 9), ('fw-01', 7), ('vpn-02', 4)]",
      },
      {
        title: "Pick the structure by the question",
        body: "Keep the list when order and duplicates matter, convert to a set when only distinct values matter, use a dict when you look up by key, a tuple for a record that must not change.",
        code: "hosts = [\"fw-01\", \"db-03\", \"fw-01\"]\nprint(len(hosts))\nprint(len(set(hosts)))\nprint(\"fw-01\" in hosts)",
        output: "3\n2\nTrue",
      },
    ],
    takeaway: "List for order, set for uniqueness, dict for lookup by key, tuple for a fixed record.",
  },

  // -------------------------------------------------------------------------
  // World 3 — Logic Gate
  // -------------------------------------------------------------------------
  conditions: {
    intro:
      "The gate's job is to let one sign-in through and lock the next, and until now every script has done the same thing for every input. A condition is where the code decides: compare a value, run one block if the comparison holds and a different block if it does not.",
    notes: [
      {
        title: "A comparison is a question with a True or False answer",
        body: "== asks equal, != asks different, < > <= >= compare size. Text compares exactly, so case matters.",
        code: "print(443 == 443)\nprint(\"admin\" != \"Admin\")\nprint(10 > 10)",
        output: "True\nTrue\nFalse",
      },
      {
        title: "if runs its block only when the test is True",
        body: "The colon opens the block and the indent marks what belongs to it. The unindented line afterwards runs either way.",
        code: "failed_logins = 5\nif failed_logins >= 5:\n    print(\"lock the account\")\nprint(\"check complete\")",
        output: "lock the account\ncheck complete",
      },
      {
        title: "else covers everything the if did not",
        body: "Exactly one of the two blocks runs. There is no test on else; it is the fallthrough.",
        code: "port = 8080\nif port < 1024:\n    print(\"privileged\")\nelse:\n    print(\"unprivileged\")",
        output: "unprivileged",
      },
      {
        title: "elif chains tiers; the first true branch wins",
        body: "An elif is only tested when every branch above it was False. Order the tests from strictest to loosest, and add else for whatever is left.",
        code: "score = 7\nif score >= 9:\n    print(\"critical\")\nelif score >= 5:\n    print(\"high\")",
        output: "high",
      },
    ],
    takeaway: "if tests a condition, elif tests the next one only if the first failed, else catches the rest.",
  },
  "boolean-logic": {
    intro:
      "A single signal rarely decides anything at the gate: new device and unusual region together is account takeover, five failed logins or an admin account earns a closer look. and, or and not combine tests into one decision, and Python's idea of what counts as True reaches well beyond the booleans themselves.",
    notes: [
      {
        title: "and needs both, or needs one",
        body: "and is True only when every side is True. or is True when at least one side is.",
        code: "new_device = True\nunusual_region = False\nprint(new_device and unusual_region)\nprint(new_device or unusual_region)",
        output: "False\nTrue",
      },
      {
        title: "not flips the answer",
        body: "not True is False and not False is True. It reads naturally inside an if: if not is_admin.",
        code: "is_admin = False\nprint(not is_admin)\nif not is_admin:\n    print(\"standard review\")",
        output: "True\nstandard review",
      },
      {
        title: "and binds tighter than or",
        body: "a and b or c reads as (a and b) or c, never as a and (b or c). Bracket whenever the two readings would disagree, which is exactly when it matters.",
        code: "new_device = False\nunusual_region = False\nfailed = 5\nprint(new_device and unusual_region or failed >= 5)\nprint(new_device and (unusual_region or failed >= 5))",
        output: "True\nFalse",
      },
      {
        title: "Empty and zero read as False; check None with is",
        body: "An empty list, 0 and None all count as False in a test, so if alerts: means \"if there are any\". For None specifically, write is None rather than == None.",
        code: "alerts = []\nprint(bool(alerts))\nprint(bool(0))\nowner = None\nprint(owner is None)",
        output: "False\nFalse\nTrue",
      },
    ],
    takeaway: "and needs every test True, or needs one, not flips it, and empty or zero values read as False.",
  },

  // -------------------------------------------------------------------------
  // World 4 — Drone Fleet
  // -------------------------------------------------------------------------
  "for-loops": {
    intro:
      "The fleet has twelve drones and the tower has been writing twelve nearly identical lines to check each battery. A for loop runs one block once per item in a collection, so the check is written once and the fleet can grow to a hundred without another line of code.",
    notes: [
      {
        title: "for runs the block once per item",
        body: "The loop variable takes each value in turn, first to last. The indented block is the work done for each one.",
        code: "drones = [\"d-01\", \"d-02\", \"d-03\"]\nfor drone in drones:\n    print(f\"{drone} checked\")",
        output: "d-01 checked\nd-02 checked\nd-03 checked",
      },
      {
        title: "range counts for you",
        body: "range(3) produces 0, 1, 2. Like a slice, it stops before the number you give it.",
        code: "for cycle in range(3):\n    print(cycle)",
        output: "0\n1\n2",
      },
      {
        title: "Accumulate a total outside the loop",
        body: "Start the running total before the loop, add to it inside, read it after. The variable must be created outside or each pass would reset it.",
        code: "batteries = [80, 45, 61]\ntotal = 0\nfor level in batteries:\n    total = total + level\nprint(total / len(batteries))",
        output: "62.0",
      },
      {
        title: "items() loops over a dictionary as pairs",
        body: "Two loop variables, one for the key and one for the value, unpacked from each pair.",
        code: "battery = {\"d-01\": 80, \"d-02\": 45}\nfor name, level in battery.items():\n    print(f\"{name}: {level}%\")",
        output: "d-01: 80%\nd-02: 45%",
      },
    ],
    takeaway: "for item in collection runs the block once per item, and an accumulator created outside the loop collects the answer.",
  },
  "while-loops": {
    intro:
      "A patrol drone should stop at the first threat, not fly the whole route, and a battery drains until it hits the reserve, not for a fixed number of cycles. A while loop repeats as long as a condition holds, and the line inside it that changes that condition is the only thing between you and a drone that loops forever.",
    notes: [
      {
        title: "while repeats as long as the condition is True",
        body: "The condition is checked before every pass. The last line changes battery, so the condition eventually fails; without it the loop never ends.",
        code: "battery = 30\nwhile battery >= 10:\n    print(battery)\n    battery = battery - 10",
        output: "30\n20\n10",
      },
      {
        title: "Walk a list with an index",
        body: "Start at 0, stop while i < len(sectors), not <=, because the last position is len - 1. The i = i + 1 is the line that moves the loop forward.",
        code: "sectors = [\"north\", \"east\", \"south\"]\ni = 0\nwhile i < len(sectors):\n    print(i, sectors[i])\n    i = i + 1",
        output: "0 north\n1 east\n2 south",
      },
      {
        title: "break leaves the loop early",
        body: "The moment break runs, the loop is over and nothing after it in the block executes. It works the same in for and while.",
        code: "for sector in [\"n1\", \"n2\", \"e1\", \"e2\"]:\n    if sector == \"e1\":\n        break\n    print(sector)",
        output: "n1\nn2",
      },
      {
        title: "continue skips to the next pass",
        body: "The rest of the block is skipped for this item only; the loop carries on with the next one.",
        code: "for level in [80, 5, 60]:\n    if level < 10:\n        continue\n    print(level)",
        output: "80\n60",
      },
    ],
    takeaway: "while keeps going as long as the condition is True, so something inside the loop must change that condition.",
  },
  comprehensions: {
    intro:
      "Half the fleet code is the same three lines: make an empty list, loop, append. A comprehension folds that loop-and-append into one expression that states what the new collection is, and reads like a sentence: the name of every drone whose battery is low.",
    notes: [
      {
        title: "Loop-and-append, the long way",
        body: "Empty list, loop, append each transformed item. This is the pattern a comprehension replaces.",
        code: "levels = [80, 45, 60]\ndoubled = []\nfor level in levels:\n    doubled.append(level * 2)\nprint(doubled)",
        output: "[160, 90, 120]",
      },
      {
        title: "The same thing as one expression",
        body: "Read it right to left: for each level in levels, keep level * 2. The result is the finished list.",
        code: "levels = [80, 45, 60]\nprint([level * 2 for level in levels])",
        output: "[160, 90, 120]",
      },
      {
        title: "Add if to filter",
        body: "Only items that pass the test are kept. Loop over items() to filter a dictionary by its values.",
        code: "drones = {\"d-01\": 80, \"d-02\": 5, \"d-03\": 60}\nlow = [name for name, level in drones.items() if level < 10]\nprint(low)",
        output: "['d-02']",
      },
      {
        title: "Braces build sets and dicts",
        body: "Curly braces with one expression make a set, with key: value make a dict. Same loop, different container.",
        code: "zones = [\"north\", \"east\", \"north\"]\nprint(sorted({z for z in zones}))\nprint({z: len(z) for z in zones})",
        output: "['east', 'north']\n{'north': 5, 'east': 4}",
      },
    ],
    takeaway: "A comprehension is loop-and-append written as one expression: [item for item in collection if test].",
  },

  // -------------------------------------------------------------------------
  // World 5 — Automation Factory
  // -------------------------------------------------------------------------
  functions: {
    intro:
      "Two factory scripts each re-implemented hostname clean-up inside their counting logic and disagreed by three hosts. A function is a machine you build once, name, and call from anywhere: give it inputs, get a result back, and the count no longer needs to know how cleaning works.",
    notes: [
      {
        title: "def builds it, calling runs it",
        body: "def names the machine and its parameters; the indented block is what it does. Nothing runs until you call it with real values.",
        code: "def clean(raw):\n    return raw.strip().lower()\nprint(clean(\"  EDGE-FW-01 \"))",
        output: "edge-fw-01",
      },
      {
        title: "return hands a value back; print only shows it",
        body: "A function with no return gives the caller None, however much it printed. If another line needs the result, it must be returned.",
        code: "def double(n):\n    print(n * 2)\nresult = double(21)\nprint(result)",
        output: "42\nNone",
      },
      {
        title: "Machines call machines",
        body: "is_internal does not know how to clean a name; it asks clean. Each function does one job and the bigger one composes them.",
        code: "def clean(raw):\n    return raw.strip().lower()\ndef is_internal(host):\n    return clean(host).endswith(\".corp\")\nprint(is_internal(\" DB-02.CORP \"))",
        output: "True",
      },
      {
        title: "Names assigned inside stay inside",
        body: "Assigning to total inside the function creates a local total; the one outside is untouched. Pass values in and return them out rather than reaching across.",
        code: "total = 0\ndef bump(n):\n    total = n\n    return total\nprint(bump(5), total)",
        output: "5 0",
      },
    ],
    takeaway: "def names a machine, arguments go in, return sends the result out; print only shows it.",
  },
  arguments: {
    intro:
      "The factory's rule builder is called from a dozen places, and nearly every caller wants the same default action, but not quite all of them. Default arguments give a parameter a sensible value unless the caller says otherwise, keyword arguments let the caller name which slot they are filling, and *args lets one machine take however many inputs arrive.",
    notes: [
      {
        title: "Positional arguments fill slots in order",
        body: "First value to the first parameter, second to the second. Swap the order and the rule silently means something else.",
        code: "def rule(source, port, action):\n    return f\"{action} {source}:{port}\"\nprint(rule(\"10.0.0.7\", 443, \"allow\"))",
        output: "allow 10.0.0.7:443",
      },
      {
        title: "Keyword arguments name the slot",
        body: "Write parameter=value and the order no longer matters. The call documents itself.",
        code: "def rule(source, port, action):\n    return f\"{action} {source}:{port}\"\nprint(rule(port=22, action=\"deny\", source=\"10.0.0.9\"))",
        output: "deny 10.0.0.9:22",
      },
      {
        title: "Defaults apply unless overridden",
        body: "A parameter with = in the def is optional; leave it out and the default is used. Parameters with defaults come after those without.",
        code: "def rule(source, port, action=\"allow\"):\n    return f\"{action} {source}:{port}\"\nprint(rule(\"10.0.0.7\", 443))\nprint(rule(\"10.0.0.7\", 443, action=\"deny\"))",
        output: "allow 10.0.0.7:443\ndeny 10.0.0.7:443",
      },
      {
        title: "*args collects any number of values",
        body: "Inside the function, counts is a tuple of whatever was passed, possibly empty. sum of an empty tuple is 0.",
        code: "def total(*counts):\n    return sum(counts)\nprint(total(3, 4, 5))\nprint(total())",
        output: "12\n0",
      },
    ],
    takeaway: "Arguments fill parameters by position or by name, defaults fill the rest, and *args gathers however many are left.",
  },
};
