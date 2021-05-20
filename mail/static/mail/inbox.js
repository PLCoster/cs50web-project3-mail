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

  // Update email status to read if not already:
  if (!emailObj['read']) {
    change_email_status('read', true, emailObj['id']);
  }

  // Add email content to screen
  document.querySelector('#email-subject').innerHTML = emailObj['subject'];
  document.querySelector('#email-date').innerHTML = emailObj['timestamp']
  document.querySelector('#email-recipients').innerHTML = emailObj['recipients'].join(', ')
  document.querySelector('#email-body').innerHTML = emailObj['body']

  // Setup Archive Button and hide on Sent Mailbox:
  const emailArchive = document.querySelector('#email-archive')
  if (curr_mailbox === 'sent') {
    emailArchive.style.display = 'none';
    emailArchive.disabled = true;
  } else {
    emailArchive.setAttribute('email-id', `${emailObj['id']}`)
    emailArchive.setAttribute('email-archived', `${emailObj['archived']}`)
    if(emailObj['archived']) {
      emailArchive.innerHTML = `<i class="fa fa-archive" aria-hidden="true"></i> Unarchive`
    } else {
      emailArchive.innerHTML = `<i class="fa fa-archive" aria-hidden="true"></i> Archive`
    }
    emailArchive.style.display = 'block';
    emailArchive.disabled = false;
  }

  // Show email view, hide other views
  document.querySelector('#mailbox').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
}


function fetch_emails(mailbox) {
  // Fetch desired emails from specified mailbox using API

  // Fetch desired emails, catch invalid mailboxes
  fetch(`/emails/${mailbox}`)
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Invalid Mailbox Accessed: Must be "inbox", "sent", "archive"')
    }
  })
  .then(emails => {
    console.log('Fetched Emails: ', emails);
    mailboxes[mailbox] = emails;
    display_mailbox(mailbox);
    }
  )
  .catch(error => {
    flash_alert('danger', error);
  });
}

function change_email_status(status, flag, email_id, callback = null) {
  // Function to mark emails as read/unread or archived/unarchived
  // Sends request to API to update database
  // status: string 'read' or 'archived'
  // flag: boolean
  // email_id: integer ID of the email to change status
  // callback: Optional callback to run when fetching completed and ok

  console.log('Changing Email Status: ', status, flag, email_id, typeof flag, typeof email_id)
  const body = {};
  body[status] = flag;

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
  .then(response => {
    if (!response.ok) {throw new Error('Email not found.');}
    if (callback) {callback();}
  })
  .catch(error => {
    flash_alert('danger', error);
  });
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
    flash_alert('warning', `No items currently in your ${mailbox} mailbox!`)
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

  // When archive button is pressed, archive/unarchive email
  document.querySelector('#email-archive').addEventListener('click', function() {
    // Archive the email, with callback to load inbox and alert when done

    let text;
    let mailbox;
    let flag = this.getAttribute('email-archived') !== 'true';
    let email_id = parseInt(this.getAttribute('email-id'));

    if (flag) {
      text = 'Email has been archived!'
      mailbox = 'inbox'
    } else {
      text = 'Archived email moved back to inbox!'
      mailbox = 'archive'
    }

    const callback = function() {
      load_mailbox(mailbox);
      flash_alert('success', text)
    }
    change_email_status('archived', flag, email_id, callback)
  })

  // Set up buttons to hide alert messages
  document.querySelectorAll('.close').forEach((el) => {
    console.log(el);
    el.addEventListener('click', function() {this.parentElement.style.display = 'none'})
  });

  // By default, load the inbox
  load_mailbox('inbox');
});