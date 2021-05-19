let mailboxes = {};
let curr_mailbox = undefined;
let curr_email = undefined;

function compose_email() {
  // Switches to compose email view

  hide_alerts();

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // Switch between mailbox views (Inbox, Sent, Archived)

  // Hide any alerts and update current mailbox
  hide_alerts();
  curr_mailbox = mailbox;

  // Get current emails for mailbox through API
  fetch_emails(mailbox);

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#mailbox-name').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
}

function fetch_emails(mailbox, email_id = null) {
  // Fetch desired email(s) from specified mailbox using API
  // If email_id is set, fetches a single email from the users emails instead, and then displays it.

  let request;

  if (!email_id) {
    request = `/emails/${mailbox}`
  } else {
    request = `/emails/${email_id}`
  }

  // Fetch desired emails
  fetch(request)
  .then(response => response.json())
  .then(emails => {
    console.log('Fetched Emails: ', emails);
    if(!email_id) {
      mailboxes[mailbox] = emails;
      console.log('Mailbox updated: ', mailboxes);
      display_mailbox(mailbox);
    }
  })
  .catch(error => {
    console.log('Error:', error);
  })
}

function display_mailbox(mailbox) {
  // Displays all emails in currently selected mailbox

  console.log('Displaying Mailbox')
  const mailboxView = document.querySelector('#mailbox-view');
  mailboxView.innerHTML = '';

  // If no emails, display text:
  if (mailboxes[mailbox].length === 0) {
    flash_alert('warning', `No items currently in your ${mailbox} emails mailbox!`)
  } else {
    // Build mailbox div for each email
    mailboxes[mailbox].forEach(emailObj => {
      console.log('Creating Email in Inbox');

      const email = document.createElement('div');
      email.classList.add('mailbox-email');

      const sender = document.createElement('p');
      sender.classList.add('mailbox-sender', 'clearfix');
      sender.innerHTML = emailObj['sender'];
      email.append(sender);

      const date = document.createElement('p');
      date.classList.add('mailbox-date', 'clearfix');
      date.innerHTML = emailObj['timestamp'];
      email.append(date);

      const subject = document.createElement('p');
      subject.classList.add('mailbox-subject');
      subject.innerHTML = emailObj['subject'];
      email.append(subject);

      mailboxView.append(email);
  })
  }
}

function send_email() {

  console.log("Trying to Send Email");

  // Get email details from form
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  // Check form for errors (nmissing addresses)
  if (recipients === '') {
    flash_alert('warning', "Please add a valid recipient!")
    return false;
  }

  // If no errors, send email to server via API POST request
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });

  console.log(recipients, subject, body);
}

function flash_alert(type, text) {
  // Flashes desired type of alert with specified text
  // Valid alert types are 'success', 'warning' and 'danger'
  hide_alerts();
  let alert = document.querySelector(`.alert-${type}`)
  alert.children[0].innerHTML = text;
  alert.style.display = 'block';
}

function hide_alerts() {
  // Hides all flashed alert messages
  document.querySelectorAll('.alert').forEach((el) => el.style.display = 'none')
}

// Setup pages and buttons when page is loaded
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // When compose_email form is submitted, send email
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault();
    send_email()
  });

  // Set up buttons to hide alert messages
  document.querySelectorAll('.close').forEach((el) => {
    console.log(el);
    el.addEventListener('click', function() {this.parentElement.style.display = 'none'})
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

console.log('test')