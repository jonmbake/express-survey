# Express-Survey

A framework to quickly create surveys, written on top of Express.js.

To get started:

```
git clone https://github.com/jonmbake/express-survey.git
cd express-survey && npm install --production
npm start
open http://localhost:3000/example
```

The questions for the example survey defined in `json/survey_instances/example.json` will be displayed within the web browsers.  Navigating to `http://localhost:3000/example/results` will display the results of the survey.

## Survey Types

*Express-Survey* currently supports two types: **Open** (default) and **Closed** (aka Invitation Only).

### Open

With *Open Surveys*, anyone with access to the survey URL can respond and view survey results.  This is the default.

### Closed

*Closed Surveys*, on the other hand, can only be viewed and responded to by people you specify on an *invitation list*.  Closed surveys are specified by adding an *invite_list* property to the *Survey Instance Definition*, which lives in `json/survey_instances`.  See `json/survey_instances/invite_only_example.json` for an example.

A unique token is generated for each invitee, which is then sent to them as a query param appended to the survey URL.  Somehow this URL has to be sent to them; you do this by specifying a *transporter*.  There are currently two transporter defined: *slack* and *email*.  The transporter is defined by the *invitation_transporter* property in the *Survey Instance Definition*.  It defaults to *email*.

Note: when using a *slack* transporter you must define a `slack_webhook_url` and `slack_from_username` in `json/app_config.json`.  When using *email*, you must `email_service`, `email_from_address` and `email_from_password`.

## Further Configuration

### Defining Fields

A survey is composed of fields.  Fields for a survey are defined in `json/field_sets`.  *Field Sets* can have the following properties

Name        | Description
----------- | ---------------------------------------------------------------
title       | Displays as label to the field in the survey.
name        | Internal name.  Will be used as database column name.
type        | Can be *number*, *text* or *options*.
validations |  Array of validations, which will be enforced on submitted survey values.  Possible validations are: *required*, *min* and *max*.  Types are also validated.

### Defining Survey Instances

Survey instances are defined in `json/survey_instances`.  The following properties can be defined:

Name                   | Description
---------------------- | ------------------------------------------------------
title                  | Displays as the header when navigating to the survey instance page.
message                | Short message that displays under the title heading.
html_escape_message    |  Should the message be HTML-escaped?  Defaults to true.
field_set              | Field set to use with survey.  Must reference a file defined in `json/field_sets`.
invite_list            | Invitation list (if Closed Survey).
invitation_transporter | Transporter to use to send out survey invitations.  Defaults to *email*.

**The Survey Instance file name defines the URL that the survey will be accessible from**

### Defining Invitation Lists

*Invitations Lists* are defined in *json/invite_lists*.  The definition is an Array of Objects with *name* and *address* properties.

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

