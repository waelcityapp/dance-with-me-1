import re

with open("lint_output.txt", "w") as f:
    f.write("""src/components/admin/AdminPanel.tsx(954,9): error TS2657: JSX expressions must have one parent element.
src/components/admin/AdminPanel.tsx(1010,14): error TS17008: JSX element 'AnimatePresence' has no corresponding closing tag.
src/components/admin/AdminPanel.tsx(1131,18): error TS1382: Unexpected token. Did you mean '{'>'}' or '&gt;'?
src/components/admin/AdminPanel.tsx(1183,15): error TS17002: Expected corresponding JSX closing tag for 'motion.div'.
...
""")
