let mailboxes = {};
let curr_mailbox = undefined;
let curr_email = undefined;
let text_break = '-----------------------------------------------------'


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


function sanitize_str(str) {
  // Helper function for viewing emails inbox
  // Sanitizes JS string to replace HTML special chars with escaped versions
  let safe_str = str.replace(/&/g, '&amp;')
                    .replace(/\"/g, '&quot;')
                    .replace(/\'/g, '&#039;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
  return safe_str;
}


function unsanitize_str(str) {
  // Helper function when using reply functionality
  // Undoes sanitisation to display email text correctly inside HTML form
  let form_str = str.replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '\"')
                  .replace(/&#039;/g, '\'')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>');
  return form_str;
}


function getDateStr(date=undefined) {
  // Helper function that returns date string in
  // 'Mon DD YYYY' format for displaying in inbox/comparing dates
  // If called with no date, returns current date
  if (!date) {
    let todayStr = (new Date()).toString().slice(0, 15).replace(',', ' ');
    return todayStr;
  } else {
    let dateStr = (new Date(date)).toString().slice(0, 15).replace(',', ' ');
    return dateStr
  }
}


function compose_email(prefill=false, recipients='', subject='', body='') {
  // Switches to compose email view
  hide_alerts();

  // Clear out composition fields if not prefilled
  if (!prefill) {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  } else {
    // Add 'Re:' to subject line if not already there
    if (subject.slice(0,4) !== 'Re: ') {subject = `Re: ${subject}`;}
    document.querySelector('#compose-recipients').value = unsanitize_str(recipients);
    document.querySelector('#compose-subject').value = unsanitize_str(subject);
    document.querySelector('#compose-body').value = unsanitize_str(body);
    console.log('Text for reply:', body)
  }

  // Show compose view and hide other views
  document.querySelector('#mailbox').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
}


function prefill_compose(type="reply") {
  // Prefills compose email view then switches to view
  let sender;
  if (type === "reply") {
    sender = document.querySelector('#email-sender').innerHTML;
  } else if (type === "reply-all") {
    sender = document.querySelector('#email-recipients').innerHTML.slice(4);
  } else {
    sender = "";
  }

  const subject = document.querySelector('#email-subject').innerHTML;
  const date = document.querySelector('#email-date').innerHTML;
  let body = `On ${date}, ${sender} wrote:\n${text_break}\n${document.querySelector('#email-body').innerHTML}\n${text_break}\n`;

  compose_email(true, sender, subject, body);
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

  // Add HTML-sanitised email content to screen
  document.querySelector('#email-subject').innerHTML = sanitize_str(emailObj['subject']);
  document.querySelector('#email-sender').innerHTML = sanitize_str(emailObj['sender']);
  document.querySelector('#email-date').innerHTML = sanitize_str(emailObj['timestamp']);
  document.querySelector('#email-recipients').innerHTML = sanitize_str(`To: ${emailObj['recipients'].join(', ')}`);
  document.querySelector('#email-body').innerHTML = sanitize_str(emailObj['body']);

  // Setup Reply/Forward/Archive Buttons (hide on Sent Mailbox):
  const emailArchive = document.querySelector('#email-archive');
  const reply = document.querySelector('#email-reply');
  const replyAll = document.querySelector('#email-reply-all');
  const forward = document.querySelector('#email-forward');
  const buttons = [emailArchive, reply, replyAll, forward];
  if (curr_mailbox === 'sent') {
    buttons.forEach(button => {
      button.style.display = 'none';
      button.disabled = true;
    })
  } else {
    emailArchive.setAttribute('email-id', `${emailObj['id']}`)
    emailArchive.setAttribute('email-archived', `${emailObj['archived']}`)
    if(emailObj['archived']) {
      emailArchive.innerHTML = `<i class="fa fa-archive" aria-hidden="true"> </i> Unarchive`
    } else {
      emailArchive.innerHTML = `<i class="fas fa-archive" aria-hidden="true"> </i> Archive`
    }
    buttons.forEach(button => {
      button.style.display = 'block';
      button.disabled = false;
    })
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

    // Get current date and date of newest email in mailbox
    let today = getDateStr();
    let inboxDate = getDateStr(mailboxes[mailbox][0]['timestamp']);

    // If newest email is from today, add 'Today' divider, otherwise add date
    const dateDiv = document.createElement('div');
    if (inboxDate === today) {
      dateDiv.innerHTML = 'Today';
    } else {
      dateDiv.innerHTML = inboxDate;
    }
    mailboxView.append(dateDiv);

    // Iterate through all emails in mailbox, and add then to view
    mailboxes[mailbox].forEach(emailObj => {

      // If email has new date, add date divider:
      let mailDate = getDateStr(emailObj['timestamp']);
      if (mailDate !== inboxDate) {
        inboxDate = mailDate;
        const dateDiv = document.createElement('div');
        dateDiv.innerHTML = inboxDate;
        mailboxView.append(dateDiv);
      }

      // Build email element and add to inbox view
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
      // If no errors then load sent emails, email sent successfully
      if(!result.hasOwnProperty('error')) {
        // Load sent mailbox and alert that email was successfully sent
        load_mailbox('sent');
        flash_alert('success', `Email sent successfully!`);
      }
      // If Errors, remain on compose page and flash warning
      else {
        flash_alert('warning', result['error'] + ' Please check recipients and try again.')
      }
  })
}


// Setup pages and buttons when page is loaded
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(false));

  // When compose_email form is submitted, send email
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault();
    send_email()
  });

  // When archive button is pressed, archive/unarchive email
  document.querySelector('#email-archive').addEventListener('click', function() {
    // Archive the email, with callback to load inbox and alert when done
    let text;
    let flag = this.getAttribute('email-archived') !== 'true';
    let email_id = parseInt(this.getAttribute('email-id'));

    if (flag) {
      text = 'Email has been archived!'
    } else {
      text = 'Archived email moved back to inbox!'
    }

    const callback = function() {
      load_mailbox('inbox');
      flash_alert('success', text)
    }
    change_email_status('archived', flag, email_id, callback)
  })

  // When reply buttons are pressed, go to prefilled compose view
  document.querySelector('#email-reply').addEventListener('click', function() {prefill_compose()});
  document.querySelector('#email-reply-all').addEventListener('click', function() {prefill_compose("reply-all")});
  document.querySelector('#email-forward').addEventListener('click', function() {prefill_compose("forward")});

  // Set up buttons to hide alert messages
  document.querySelectorAll('.close').forEach((el) => {
    console.log(el);
    el.addEventListener('click', function() {this.parentElement.style.display = 'none'})
  });

  // By default, load the inbox
  load_mailbox('inbox');
});