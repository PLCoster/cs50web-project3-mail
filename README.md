# CS50 Web 2020 Project 3: Mail

## CS50 Web - Programming with Python and JavaScript

### Project Aims:

The aim of the project is to build a front-end for a single-page email client app, using HTML and JavaScript. The page makes API calls to a Django back-end in order to send and receive emails between registered users. Emails between users are stored and read from a database on the back-end.

### Technologies:

* Back-end:
  * Python
  * Django

* Front-end:
  * HTML
  * JavaScript
  * CSS (with some Bootstap Components)

### API Details:

The single-page front-end app uses calls to the applications API in order to:

* **Email Inbox**: Get all emails from a user's inbox (inbox, sent and archive inboxes available):
  * Send a `GET` request to `/emails/<mailbox>` where `<mailbox>` is either `inbox`, `sent`, or `archive` to receive in JSON form a list of all emails in the mailbox, in reverse chronological order. An email object looks like this:
  ```
  {
        "id": 100,
        "sender": "foo@example.com",
        "recipients": ["bar@example.com"],
        "subject": "Hello!",
        "body": "Hello, world!",
        "timestamp": "Jan 2 2020, 12:00 AM",
        "read": false,
        "archived": false
  }
    ```
  * Requesting a mailbox other than `inbox`, `sent` or `archive` will result in a JSON response of `{"error": "Invalid mailbox."}`

* **Single Email**: Get a single email by its unique ID:
  * Send a `GET` request to `/emails/<email_id>` where `email_id` is an integer id for an email, to receive a JSON representation of the single email (format as above).
  * If the requested email does not exist, or the user does not have access to this email, the route instead return a 404 Not Found error with a JSON response of `{"error": "Email not found."}`.

* **Sending Emails**: To send an email to the server:
  * Send a `POST` request to the `/emails` route. The route requires the body of the request to contain a JSON object containing the following:
    * a `recipients` value (a comma-separated string of all users to send an email to)
    * a `subject` string for the email subject
    * a `body` string for the main email text
  * For example:
```
{
      recipients: 'baz@example.com',
      subject: 'Meeting time',
      body: 'How about we meet tomorrow at 3pm?'
}
```
  * If the email is sent successfully, the route will respond with a 201 status code and a JSON response of `{"message": "Email sent successfully."}`
  * If no recipient is provided, the route will respond with a 400 status code and a JSON response of `{"error": "At least one recipient required."}`
  * If the receipient does not exist, instead the response will be `{"error": "User with email baz@example.com does not exist."}`

* **Mark Emails**: To archive/unarchive emails or mark individual emails as read/unread:
  * Sent a `PUT` request to `/emails/<email_id>` where `email_id` is the id of the email you're trying to modify. The route requires the body of the request to contain a JSON object with a key of either `archived` or `read` and a value of `true` or `false`.
    * `{archived: true}` will archive the email, `{archived: false}` will unarchive the message.
    * `{read: true}` will mark the email as read, `{read: false}` will mark the email as unread.

### Project Requirements:

Using JavaScript, HTML, and CSS, complete the implementation of your single-page-app email client inside of inbox.js (and not additional or other files). The app must fulfill the following requirements:

* **Send Mail**: When a user submits the email composition form, add JavaScript code to actually send the email.
  * Once the email has been sent, load the user’s sent mailbox.
* **Mailbox**: When a user visits their Inbox, Sent mailbox, or Archive, load the appropriate mailbox.
  * When a mailbox is visited, the application should first query the API for the latest emails in that mailbox.
  * When a mailbox is visited, the name of the mailbox should appear at the top of the page.
  * Each email should then be rendered in its own box (e.g. as a `<div>` with a border) that displays who the email is from, what the subject line is, and the timestamp of the email.
  * If the email is unread, it should appear with a white background. If the email has been read, it should appear with a gray background.
* **View Email**: When a user clicks on an email, the user should be taken to a view where they see the content of that email.
  * Your application should show the email’s sender, recipients, subject, timestamp, and body.
  * Once the email has been clicked on, you should mark the email as read.
* **Archive and Unarchive**: Allow users to archive and unarchive emails that they have received.
  * When viewing an Inbox email, the user should be presented with a button that lets them archive the email. When viewing an Archive email, the user should be presented with a button that lets them unarchive the email. This requirement does not apply to emails in the Sent mailbox.
  * Once an email has been archived or unarchived, load the user’s inbox.
* **Reply**: Allow users to reply to an email.
  * When viewing an email, the user should be presented with a “Reply” button that lets them reply to the email.
  * When the user clicks the “Reply” button, they should be taken to the email composition form.
  * Pre-fill the composition form with the recipient field set to whoever sent the original email.
  * Pre-fill the subject line. If the original email had a subject line of foo, the new subject line should be Re: foo. (If the subject line already begins with Re: , no need to add it again.)
  * Pre-fill the body of the email with a line like "On Jan 1 2020, 12:00 AM foo@example.com wrote:" followed by the original text of the email.

### Project Writeup:
TODO

### Usage:

Requires Python(3) and the Python Pacakage Installe (pip) to run:
* Install requirements (Django): `pip install -r requirements.txt`
* Make and apply migrations to database:

```
python manage.py makemigrations mail
python manage.py migrate

```
* Run the app locally: `python manage.py runserver`
