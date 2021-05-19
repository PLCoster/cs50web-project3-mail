let mailboxes = {};
let curr_mailbox = undefined;
let curr_email = undefined;


function compose_email() {
  // Switches to compose email view

  hide_alerts();

  // Show compose view and hide other views
  document.querySelector('#mailbox').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
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
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#mailbox').style.display = 'block';

  // Show the mailbox name
  document.querySelector('#mailbox-name').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
}


function view_email(emailObj) {
  // View individual email when clicked on in a mailbox

  // Hide any alerts
  hide_alerts();

  // Add email content to screen
  document.querySelector('#email-subject').innerHTML = emailObj['subject'];
  document.querySelector('#email-date').innerHTML = emailObj['timestamp']
  document.querySelector('#email-recipients').innerHTML = emailObj['recipients'].join(', ')
  document.querySelector('#email-body').innerHTML = emailObj['body']

  // Show email view, hide other views
  document.querySelector('#mailbox').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

}


function fetch_emails(mailbox) {
  // Fetch desired emails from specified mailbox using API

  // Fetch desired emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log('Fetched Emails: ', emails);
    mailboxes[mailbox] = emails;
    display_mailbox(mailbox);
    }
  )
  .catch(error => {
    console.log('Error:', error);
  })
}


function display_mailbox(mailbox) {
  // Displays all emails in currently selected mailbox
  // Counts and displays number of unread emails

  console.log('Displaying Mailbox')
  const mailboxView = document.querySelector('#mailbox-view');
  mailboxView.innerHTML = '';
  let unread = 0;

  // If no emails, display text:
  if (mailboxes[mailbox].length === 0) {
    flash_alert('warning', `No items currently in your ${mailbox} emails mailbox!`)
  } else {
    // Build mailbox div for each email
    mailboxes[mailbox].forEach(emailObj => {
      console.log('Creating Email in Inbox');

      const email = document.createElement('div');
      email.classList.add('mailbox-email');
      if (emailObj['read'] === true) {
        email.classList.add('read')
      } else {
        unread++;
      };
      email.addEventListener('click', () => view_email(emailObj));

      const status = document.createElement('div');
      status.classList.add(`mailbox-read-${emailObj['read']}`);
      email.append(status);

      const sender = document.createElement('p');
      sender.classList.add('mailbox-sender');
      sender.innerHTML = emailObj['sender'];
      email.append(sender);

      const date = document.createElement('p');
      date.classList.add('mailbox-date');
      date.innerHTML = emailObj['timestamp'];
      email.append(date);

      const subject = document.createElement('p');
      subject.classList.add('mailbox-subject');
      subject.innerHTML = emailObj['subject'];
      email.append(subject);

      mailboxView.append(email);
    })
  }

  // Add number of unread emails to mailbox name, if not sent mailbox
  if (mailbox != 'sent') {
    const unreadSpan = document.createElement('span');
    unreadSpan.innerHTML = ` (${unread})`;
    document.querySelector('#mailbox-name').append(unreadSpan);
  }
}


function send_email() {

  console.log("Trying to Send Email");

  // Get email details from form, with some error checking
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  if (subject === '') {subject = '(No Subject)'}
  let body = document.querySelector('#compose-body').value;
  if (body === '') {body = '(No Email Body)'}

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
      // Load sent mailbox and alert that email was successfully sent
      load_mailbox('sent');
      flash_alert('success', `Email sent successfully!`);
  });
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