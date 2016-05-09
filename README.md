# openstax-glossary-generator
A glossary generator for instructors using OpenStax Connexions to author textbooks. This script:

- Lets you import a module from file or directly from text
- Parses it and automatically generates a glossary for any items tagged with a <term> tag
- Auto-generates a unique, meaningful id for every term, definition and meaning
- Wraps each term in the body of the module with a link to the definition in the glossary
- For modules with an existing glossary, only adds terms that are not already listed (while editing existing entries to match script's id scheme)
- Optionally, allows you to delete any glossary entries by simply removing the <term> tag from the body of the module
- Optionally, allows you to merge two separate terms into one
- Allows you to edit the text in an inline editor and apply changes instantly without having to re-import your module
- Gives you the option to export your edited module to a file

See the script in action [here](https://danielrearden.neocities.org/glossary_generator.html).
