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

function compose_email() {

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

  hide_alerts();

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function send_email() {

  console.log("Trying to Send Email");

  // Get email details from form
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  // Check form for errors (no addresses)
  if (recipients === '') {
    flash_alert('warning', "Please add a valid recipient!")
  }
  console.log(recipients, subject, body);

  return false;
}

function flash_alert(type, text) {
  // Flashes desired type of alert with specified text
  hide_alerts();
  let alert = document.querySelector(`.alert-${type}`)
  alert.children[0].innerHTML = text;
  alert.style.display = 'block';
}

function hide_alerts() {
  // Hides all flashed alert messages
  document.querySelectorAll('.alert').forEach((el) => el.style.display = 'none')
}