# Express-Survey

Quickly and easily create a survey with Express/Node.

# Getting Started In Three Easy Steps

## Step 1 - Install node dependencies

```
npm install --production
```

## Step 2 - Define Your Survey

There are two JSON files that define your survey:

1. **Field Set Definition** - a field set defines the fields that will be used in the survey. Field Set definitions live in [field_sets](field_sets) directory.  A *title*, *name* and *type* property must be defined.
2. **Survey Instance**  A survey instance uses a *Field Set* to define an instance of a survey.  A *title* and *field_set* property must be defined.

Examples:
*field_sets/example/example_field_set.json*

```json
[
    {"title": "On a scale of 1 to 10 how much do you like this framework?", "name": "scale", "type": "number"},
    {"title": "What do you like about this survey framework?", "name": "likeWhat", "type": "text"},
    {"title": "Who is your favorite spice girl?", "name": "spiceGirls", "type": "select", "options": ["Posh", "Ginger", "Baby", "Scary", "Sporty"]}
]
```

*survey_instances/example.json*

```json
{
    "title": "An Example Survey",
    "field_set": "example_field_set"
}
```
## Step 3 - Startup the Express Server

```
npm start
```

# Other notes

Results are stored in a sqlite database.  Each survey instance will have a corresponding database file in the *db* directory.  You can query results directory from the database:

```bash
$> sqlite3 db/example.db
SQLite version 3.8.5 2014-08-15 22:37:57
Enter ".help" for usage hints.
sqlite> select * from responses;
1|10|Add some validation.|Scary
sqlite>
```



