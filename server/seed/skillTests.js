const mongoose = require("mongoose");
const dotenv = require("dotenv");

const SkillTest = require("../models/SkillTest");

dotenv.config();

const question = (text, options, correctAnswer, explanation) => ({
  question: text,
  options,
  correctAnswer,
  explanation,
});

const skillTests = [
  {
    skillName: "HTML",
    questions: [
      question("Which element is used for the main heading of a page?", ["<h1>", "<heading>", "<head>", "<title>"], "<h1>", "The h1 element represents the main heading on a page."),
      question("Which attribute provides alternative text for an image?", ["alt", "src", "href", "title"], "alt", "The alt attribute describes an image when it cannot be viewed and supports accessibility."),
      question("Which element creates a hyperlink?", ["<a>", "<link>", "<url>", "<nav>"], "<a>", "The anchor element creates links using its href attribute."),
      question("Which element is used for an unordered list?", ["<ul>", "<ol>", "<list>", "<li>"], "<ul>", "The ul element creates a list without an ordered numerical sequence."),
      question("Which semantic element contains the primary content of a page?", ["<main>", "<content>", "<body-content>", "<section-main>"], "<main>", "The main element identifies the dominant content of a document."),
      question("Which declaration tells the browser that a document uses HTML5?", ["<!DOCTYPE html>", "<html5>", "<!HTML5>", "<version html=5>"], "<!DOCTYPE html>", "The HTML5 doctype declaration is placed at the start of an HTML document."),
      question("Which element creates a form input control?", ["<input>", "<form-control>", "<field>", "<control>"], "<input>", "The input element creates interactive form controls such as text fields and checkboxes."),
      question("Which attribute connects a label to an input?", ["for", "label", "target", "connect"], "for", "A label's for value should match the id of its associated input."),
      question("Which element represents a list item?", ["<li>", "<item>", "<list-item>", "<ul-item>"], "<li>", "The li element represents one item inside an ordered or unordered list."),
      question("Which element embeds a video in a page?", ["<video>", "<media>", "<movie>", "<embed-video>"], "<video>", "The video element embeds video content and can provide native playback controls."),
      question("Which attribute is used as a unique identifier?", ["id", "name", "key", "unique"], "id", "The id attribute identifies one element uniquely within a document."),
      question("Which element groups navigation links semantically?", ["<nav>", "<navigation>", "<links>", "<menu-links>"], "<nav>", "The nav element identifies a section containing major navigation links."),
      question("Which element contains metadata about the document?", ["<head>", "<meta-data>", "<info>", "<header-data>"], "<head>", "The head element contains metadata, the title, and resource links."),
      question("Which attribute opens a link in a new browsing context?", ["target=\"_blank\"", "new=\"tab\"", "open=\"new\"", "window=\"blank\""], "target=\"_blank\"", "The target attribute with _blank requests a new tab or window."),
      question("Which element is best for an independent article of content?", ["<article>", "<post>", "<story>", "<content-block>"], "<article>", "The article element represents a self-contained composition that could stand alone."),
    ],
  },
  {
    skillName: "CSS",
    questions: [
      question("Which property changes the text color?", ["color", "font-color", "text-color", "foreground"], "color", "The color property sets the foreground color of text."),
      question("Which declaration makes an element a flex container?", ["display: flex", "position: flex", "flex: display", "layout: flex"], "display: flex", "display: flex enables Flexbox layout for an element's children."),
      question("Which property controls the space inside an element's border?", ["padding", "margin", "spacing", "inset"], "padding", "Padding is the space between an element's content and its border."),
      question("Which selector targets an element with the class card?", [".card", "#card", "card", "*card"], ".card", "A period prefixes a class selector in CSS."),
      question("Which unit is relative to the root element's font size?", ["rem", "px", "vh", "%"], "rem", "The rem unit is relative to the root html element's font size."),
      question("Which property changes the background color?", ["background-color", "color-background", "bg-color", "fill-color"], "background-color", "background-color sets the color behind an element's content and padding."),
      question("Which property rounds an element's corners?", ["border-radius", "corner-radius", "round-border", "radius"], "border-radius", "border-radius creates rounded corners on an element's border box."),
      question("Which declaration makes an element invisible but keeps its layout space?", ["visibility: hidden", "display: none", "opacity: remove", "hidden: true"], "visibility: hidden", "visibility hidden hides an element while preserving its layout space."),
      question("Which property controls the order of flex items?", ["order", "flex-order", "item-order", "sequence"], "order", "The order property changes the visual order of flex or grid items."),
      question("Which pseudo-class applies styles when a pointer is over an element?", [":hover", ":point", ":over", ":mouse"], ":hover", ":hover matches an element while the pointer is over it."),
      question("Which property sets the distance between grid rows and columns?", ["gap", "grid-space", "track-gap", "spacing"], "gap", "gap sets spacing between rows and columns in grid and flex layouts."),
      question("Which property controls the stacking order of positioned elements?", ["z-index", "stack-order", "layer", "depth"], "z-index", "z-index controls stacking order for positioned elements."),
      question("Which value makes a width include padding and border?", ["border-box", "include-box", "full-box", "padding-box"], "border-box", "box-sizing border-box includes padding and border in the declared width and height."),
      question("Which media query feature commonly targets a narrow viewport?", ["max-width", "screen-size", "viewport-max", "width-limit"], "max-width", "max-width lets styles apply when the viewport is at or below a specified width."),
      question("Which property controls the thickness of text?", ["font-weight", "text-thickness", "font-style", "weight"], "font-weight", "font-weight controls how light or bold text appears."),
    ],
  },
  {
    skillName: "JavaScript",
    questions: [
      question("Which keyword is used to declare a constant?", ["const", "var", "constant", "letconst"], "const", "const declares a variable binding that cannot be reassigned."),
      question("Which method converts a JSON string into a JavaScript value?", ["JSON.parse()", "JSON.stringify()", "JSON.convert()", "JSON.read()"], "JSON.parse()", "JSON.parse converts valid JSON text into a JavaScript value."),
      question("Which array method creates a new array by transforming every item?", ["map()", "filter()", "reduce()", "forEach()"], "map()", "map returns a new array containing the callback result for each item."),
      question("What does === compare?", ["Value and type", "Only value", "Only type", "Variable names"], "Value and type", "Strict equality checks both the value and the data type without coercion."),
      question("Which function runs code after a delay?", ["setTimeout()", "setDelay()", "wait()", "delayRun()"], "setTimeout()", "setTimeout schedules a function to run after a specified delay."),
      question("Which keyword declares a block-scoped variable that can be reassigned?", ["let", "var", "const", "change"], "let", "let declares a block-scoped binding that can receive a new value."),
      question("What syntax creates an arrow function?", ["() => {}", "function => ()", "arrow() {}", "=> function()"], "() => {}", "An arrow function uses an arrow between its parameters and function body."),
      question("Which method adds an item to the end of an array?", ["push()", "append()", "addEnd()", "insert()"], "push()", "push adds one or more items to the end of an array."),
      question("Which method returns the first matching array item?", ["find()", "first()", "searchOne()", "match()"], "find()", "find returns the first array element that satisfies its callback."),
      question("What does a Promise represent?", ["A future asynchronous result", "A CSS rule", "A loop counter", "A database table"], "A future asynchronous result", "A Promise represents the eventual completion or failure of an asynchronous operation."),
      question("Which syntax extracts properties from an object?", ["Destructuring", "Unpacking only", "Object slicing", "Property casting"], "Destructuring", "Object destructuring assigns selected properties to local variables."),
      question("Which operator provides a fallback only for null or undefined?", ["??", "||=", "??= only", "fallback"], "??", "The nullish coalescing operator returns the right side for null or undefined values."),
      question("Which method joins array values into one string?", ["join()", "combine()", "concatText()", "merge()"], "join()", "join creates a string from array elements using a separator."),
      question("Which event fires when a form is submitted?", ["submit", "send", "form-submit-event", "post"], "submit", "The submit event fires when a form is submitted by the user."),
      question("Which array method tests whether at least one item matches?", ["some()", "any()", "exists()", "hasOne()"], "some()", "some returns true when at least one element passes the callback test."),
    ],
  },
  {
    skillName: "React",
    questions: [
      question("What is a React component?", ["A reusable UI building block", "A database table", "A CSS property", "A server port"], "A reusable UI building block", "Components encapsulate reusable pieces of interface and behavior."),
      question("Which hook stores local component state?", ["useState", "useRoute", "useValue", "useStore"], "useState", "useState lets a function component retain and update local state."),
      question("What prop is commonly used to uniquely identify list items?", ["key", "idKey", "indexKey", "unique"], "key", "React uses key to track list items efficiently between renders."),
      question("What does JSX allow you to write?", ["UI markup in JavaScript", "SQL in CSS", "Routes in HTML", "MongoDB schemas"], "UI markup in JavaScript", "JSX is a syntax extension that lets React code describe UI with markup-like syntax."),
      question("Which hook runs side effects such as data fetching?", ["useEffect", "useFetch", "useAction", "useAsyncEffectOnly"], "useEffect", "useEffect is designed for synchronizing a component with external systems."),
      question("How do you pass data from a parent to a child component?", ["Props", "State injection", "Context only", "Events only"], "Props", "Props are values passed from a parent component to its child."),
      question("Which syntax groups multiple JSX elements without an extra DOM node?", ["Fragment", "Wrapper", "Group", "Container"], "Fragment", "A React Fragment groups elements without adding an extra rendered element."),
      question("What can a controlled input's value be connected to?", ["React state", "CSS state", "A database directly", "The DOM only"], "React state", "Controlled inputs receive their value from React state and update through event handlers."),
      question("Why are keys used when rendering a list?", ["To identify items between renders", "To encrypt items", "To style rows", "To sort values"], "To identify items between renders", "Keys help React match list items when the list changes."),
      question("What does conditional rendering control?", ["Which UI appears", "Which server starts", "Which CSS file compiles", "Which database connects"], "Which UI appears", "Conditional rendering shows different UI based on application state or props."),
      question("Which API creates a React root in modern React?", ["createRoot", "createApp", "renderRoot", "mountRoot"], "createRoot", "createRoot creates a root for rendering a React application."),
      question("What is lifting state up?", ["Moving shared state to a common parent", "Deleting state", "Saving state to a server", "Moving state into CSS"], "Moving shared state to a common parent", "Lifting state up lets sibling components share state through their parent."),
      question("What does a component re-render when its state changes?", ["Its UI output", "The database schema", "The browser URL only", "All server files"], "Its UI output", "A state update causes React to render the component output again."),
      question("What is the children prop used for?", ["Content nested inside a component", "A child process", "A database child row", "CSS descendants only"], "Content nested inside a component", "children contains the JSX nested between a component's opening and closing tags."),
      question("Which hook can memoize an expensive calculated value?", ["useMemo", "useCache", "useCompute", "useValueMemo"], "useMemo", "useMemo can cache a calculation until its dependencies change."),
    ],
  },
  {
    skillName: "Python",
    questions: [
      question("Which keyword defines a function in Python?", ["def", "function", "func", "define"], "def", "The def keyword starts a function definition."),
      question("Which data type stores an ordered, changeable collection?", ["list", "tuple", "set", "dict"], "list", "Lists are ordered collections that can be changed after creation."),
      question("How do you add an item to the end of a list?", ["append()", "add()", "push()", "insertEnd()"], "append()", "list.append adds one item to the end of a Python list."),
      question("Which symbol starts a single-line comment?", ["#", "//", "--", "/*"], "#", "Python uses # for comments that continue to the end of the line."),
      question("Which keyword handles an exception?", ["except", "catch", "handle", "error"], "except", "The except block handles an exception raised inside a try block."),
      question("Which function returns the number of items in a collection?", ["len()", "count()", "size()", "length()"], "len()", "len returns the number of items in a string, list, tuple, or other supported collection."),
      question("Which function creates a sequence of numbers?", ["range()", "sequence()", "numbers()", "series()"], "range()", "range produces an immutable sequence commonly used in loops."),
      question("Which keyword imports a module?", ["import", "include", "require", "use"], "import", "import makes names from a module available to Python code."),
      question("What does indentation define in Python?", ["Code blocks", "Variable types", "Package names", "Comments"], "Code blocks", "Python uses indentation to group statements into blocks."),
      question("Which keyword starts a loop over items?", ["for", "loop", "each", "iterate"], "for", "The for statement iterates over items from an iterable."),
      question("What does list slicing return?", ["A selected portion of a list", "A sorted list always", "A copied dictionary", "A single key"], "A selected portion of a list", "Slicing selects a range of positions from a sequence."),
      question("Which value represents no value in Python?", ["None", "Null", "Void", "Empty"], "None", "None is Python's singleton value for the absence of a value."),
      question("What is a virtual environment used for?", ["Isolating project dependencies", "Running code faster", "Encrypting scripts", "Creating databases"], "Isolating project dependencies", "Virtual environments keep a project's packages separate from other projects."),
      question("Which prefix creates a formatted string literal?", ["f", "format", "str", "template"], "f", "An f-string uses an f prefix to embed expressions inside braces."),
      question("Which method converts a string to lowercase?", ["lower()", "downcase()", "toLower()", "casefold-only()"], "lower()", "The lower method returns a lowercase version of a string."),
    ],
  },
  {
    skillName: "Java",
    questions: [
      question("Which method is the entry point of a Java application?", ["main", "start", "run", "init"], "main", "Java applications begin execution in a public static void main method."),
      question("Which keyword creates an object?", ["new", "create", "object", "instance"], "new", "The new keyword creates an object instance from a class."),
      question("Which type stores true or false?", ["boolean", "bit", "logical", "binary"], "boolean", "The boolean type represents either true or false."),
      question("Which keyword inherits from a class?", ["extends", "inherits", "implements", "super"], "extends", "A class uses extends to inherit from another class."),
      question("Which collection does not allow duplicate elements?", ["Set", "List", "Array", "Queue"], "Set", "The Set interface represents a collection that does not contain duplicate elements."),
      question("Which keyword declares a class?", ["class", "type", "define", "object"], "class", "The class keyword declares a new Java class."),
      question("Which type stores text in Java?", ["String", "Text", "CharSequenceOnly", "Words"], "String", "String represents a sequence of characters in Java."),
      question("Which collection keeps elements in insertion order and allows duplicates?", ["ArrayList", "HashSet", "TreeSet", "Map"], "ArrayList", "ArrayList is an ordered list implementation that permits duplicate elements."),
      question("Which keyword declares a method that belongs to the class?", ["static", "classMethod", "shared", "global"], "static", "A static method belongs to the class rather than a particular object."),
      question("Which access modifier limits a member to its class?", ["private", "hidden", "internal", "protected-only"], "private", "private members can be accessed directly only within their declaring class."),
      question("Which block handles an exception?", ["catch", "except", "handle", "rescue"], "catch", "A catch block handles a matching exception thrown from a try block."),
      question("Which keyword declares an interface implementation?", ["implements", "uses", "inherits", "interface-of"], "implements", "A class uses implements to provide the methods required by an interface."),
      question("Which keyword prevents a variable from being reassigned?", ["final", "constant", "fixed", "lock"], "final", "A final variable can be assigned once and cannot be reassigned."),
      question("What is a constructor used for?", ["Initializing a new object", "Deleting an object", "Compiling a class", "Importing a package"], "Initializing a new object", "A constructor runs when an object is created and initializes its state."),
      question("Which keyword declares a package at the top of a source file?", ["package", "namespace", "module", "folder"], "package", "The package statement identifies the namespace containing a Java class."),
    ],
  },
  {
    skillName: "SQL",
    questions: [
      question("Which statement retrieves data from a table?", ["SELECT", "GET", "READ", "FETCH"], "SELECT", "SELECT queries data from one or more database tables."),
      question("Which clause filters rows?", ["WHERE", "FILTER", "HAVING BY", "LIMIT BY"], "WHERE", "WHERE applies conditions to rows before grouping."),
      question("Which command adds a new row?", ["INSERT", "ADD", "CREATE ROW", "APPEND"], "INSERT", "INSERT adds new records to a table."),
      question("Which keyword sorts query results?", ["ORDER BY", "SORT BY", "GROUP BY", "ARRANGE"], "ORDER BY", "ORDER BY sorts rows by one or more selected columns."),
      question("Which function counts rows?", ["COUNT()", "TOTAL()", "ROWS()", "NUMBER()"], "COUNT()", "COUNT returns the number of rows or non-null values depending on its argument."),
      question("Which statement changes existing rows?", ["UPDATE", "CHANGE", "EDIT", "MODIFY ROW"], "UPDATE", "UPDATE changes column values in existing rows."),
      question("Which statement removes rows?", ["DELETE", "REMOVE", "DROP ROW", "CLEAR"], "DELETE", "DELETE removes rows that match an optional condition."),
      question("Which clause combines rows from related tables?", ["JOIN", "MERGE ROWS", "LINK", "CONNECT"], "JOIN", "JOIN combines rows from tables using a related condition."),
      question("Which clause groups rows for aggregate calculations?", ["GROUP BY", "COLLECT BY", "AGGREGATE BY", "PARTITION ROWS"], "GROUP BY", "GROUP BY forms groups that aggregate functions can summarize."),
      question("Which condition checks for a missing value?", ["IS NULL", "= NULL", "MISSING", "EMPTY IS"], "IS NULL", "SQL uses IS NULL because NULL does not compare with the equality operator."),
      question("What is a primary key used for?", ["Uniquely identifying rows", "Sorting every column", "Encrypting a table", "Joining only text"], "Uniquely identifying rows", "A primary key uniquely identifies each record in a table."),
      question("Which statement changes a table's structure?", ["ALTER TABLE", "CHANGE TABLE", "EDIT TABLE", "MODIFY SCHEMA NOW"], "ALTER TABLE", "ALTER TABLE adds, changes, or removes table definitions."),
      question("Which keyword removes duplicate rows from results?", ["DISTINCT", "UNIQUE ROWS", "ONLY", "DEDUP"], "DISTINCT", "DISTINCT removes duplicate result rows for the selected columns."),
      question("What does a foreign key reference?", ["A key in another table", "A hidden password", "A local variable", "A database server"], "A key in another table", "A foreign key links a row to a key in another table."),
      question("Which command permanently saves a transaction's changes?", ["COMMIT", "SAVE", "APPLY", "CONFIRM"], "COMMIT", "COMMIT makes the current transaction changes permanent."),
    ],
  },
  {
    skillName: "Git",
    questions: [
      question("Which command creates a local Git repository?", ["git init", "git start", "git create", "git repo"], "git init", "git init creates the metadata needed for a new local repository."),
      question("Which command records staged changes?", ["git commit", "git save", "git record", "git store"], "git commit", "git commit records staged changes in the repository history."),
      question("Which command downloads changes from a remote and integrates them?", ["git pull", "git download", "git sync", "git receive"], "git pull", "git pull fetches remote changes and integrates them into the current branch."),
      question("Which command shows the current working tree state?", ["git status", "git check", "git state", "git inspect"], "git status", "git status reports staged, unstaged, and untracked changes."),
      question("Which command creates a new branch?", ["git branch", "git fork", "git copy", "git split"], "git branch", "git branch can create, list, or delete branches."),
      question("Which command copies a remote repository locally?", ["git clone", "git copy", "git download", "git fork-local"], "git clone", "git clone downloads a repository and its history to a new local directory."),
      question("Which command stages a file?", ["git add", "git stage-file", "git include", "git prepare"], "git add", "git add places file changes into the staging area for the next commit."),
      question("Which command displays commit history?", ["git log", "git history", "git commits", "git timeline"], "git log", "git log displays commits and their metadata."),
      question("Which command shows unstaged differences?", ["git diff", "git changes", "git compare", "git delta"], "git diff", "git diff shows changes between working tree versions."),
      question("Which command switches to another branch?", ["git switch", "git move", "git branch-use", "git change"], "git switch", "git switch changes the current branch and updates the working tree."),
      question("Which command combines another branch into the current branch?", ["git merge", "git combine", "git join", "git apply-branch"], "git merge", "git merge integrates commits from another branch."),
      question("Which file lists files Git should ignore?", [".gitignore", ".gitfiles", "git.ignore", "ignore.git"], ".gitignore", ".gitignore contains patterns for files Git should not track."),
      question("Which command temporarily stores uncommitted changes?", ["git stash", "git hold", "git pause", "git shelf"], "git stash", "git stash saves uncommitted changes for later reapplication."),
      question("Which command lists configured remote repositories?", ["git remote -v", "git remotes", "git list-remote", "git origin"], "git remote -v", "git remote -v lists remote names and their fetch and push URLs."),
      question("Which command removes a file from the staging area but keeps its edits?", ["git reset", "git unstage", "git remove-stage", "git undo-add"], "git reset", "git reset can move changes out of the staging area without deleting the working copy."),
    ],
  },
];

async function seedSkillTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to database: ${mongoose.connection.name}`);

    await SkillTest.bulkWrite(
      skillTests.map((skillTest) => ({
        updateOne: {
          filter: { skillName: skillTest.skillName },
          update: { $set: skillTest },
          upsert: true,
        },
      }))
    );

    const testCount = await SkillTest.countDocuments();
    const questionCount = skillTests.reduce((total, test) => total + test.questions.length, 0);
    console.log(`Skill tests in database: ${testCount}`);
    console.log(`Questions seeded: ${questionCount}`);
  } catch (error) {
    console.error("Skill test seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSkillTests();
