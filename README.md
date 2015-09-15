# Express-Survey

Quickly and easily create surveys with Express/Node.

## Getting Started In Three Easy Steps

#### Step 1 - Install node dependencies

```
npm install --production
```

#### Step 2 - Define Your Survey

There are two JSON files that define your survey:

1. **Field Set Definition** - a field set defines the fields that will be used in the survey. Field Set definitions live in [field_sets](field_sets) directory.  A *title*, *name* and *type* property must be defined. The *validations* property is optional.  Valid validaton properties are *required*, *min* and *max* (for number fields).
2. **Survey Instance**  A survey instance uses a *Field Set* to define an instance of a survey.  A *title* and *field_set* property must be defined.

Examples:
*field_sets/example/example_field_set.json*

```json
[
  {"title": "On a scale of 1 to 10, how much do you like this framework?", "name": "scale", "type": "number", "validations": {"required": true, "min": 1, "max": 10}},
  {"title": "What do you like about this survey framework?", "name": "likeWhat", "type": "text", "validations": {"required": true}},
  {"title": "What aspect of the framework needs the most work?", "name": "mostWork", "type": "select", "options": ["UI", "Code Understandability", "Code Structure", "Documentation", "Demo"]}
]
```

*survey_instances/example.json*

```json
{
    "title": "An Example Survey",
    "field_set": "example_field_set"
}
```
#### Step 3 - Startup the Express Server

```
npm start
```

### The Results:

*Questions Page using the above JSON config files*
![Survey Questions Page](https://raw.githubusercontent.com/jonmbake/screenshots/master/express-survey/example_survey.png)

*Results Page using the above JSON config files*
![Survey Questions Results Page](https://raw.githubusercontent.com/jonmbake/screenshots/master/express-survey/example_survey_results.png)

## Other notes

Results are stored in a sqlite database.  Each survey instance will have a corresponding database file in the *db* directory.  You can query results directly from the database:

```bash
$> sqlite3 db/example.db
SQLite version 3.8.5 2014-08-15 22:37:57
Enter ".help" for usage hints.
sqlite> select * from responses;
1|10|Add some validation.|Scary
sqlite>
```

# To Do

1. Result Column sort
2. Add message property to survey instance config
3. Allow for invite only survey instance
    1. Link with token param sent via email
2. Allow hot loading of survey instances (currently you have to restart the server to pick up new instances)
3. Add stop/start date property to survey instance

