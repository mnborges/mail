document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
	
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  
  // Send new email
  document.querySelector('#compose-form').onsubmit = () => {
	  const recipient = document.querySelector('#compose-recipients').value;
	  const subject = document.querySelector('#compose-subject').value;
	  const body = document.querySelector('#compose-body').value;
	  fetch('/emails', {
			method: 'POST',
			body: JSON.stringify({
				recipients: recipient,
				subject: subject,
				body: body
			})
		})
		.then(response => response.json())
		.then(result => {
			// Result
			if (result.error != undefined){
				console.log(`${result.error}`);
				alert(`${result.error}`);
				
			}else{
				console.log(`${result.message}`);
				load_mailbox('sent');
			}
		});
	  return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Load emails
	fetch(`/emails/${mailbox}`)
	.then(response => response.json())
	.then(emails => {
		// Print emails
		console.log(emails);
		if (emails.error != undefined){
			return alert(emails.error);
		}else {
			emails.forEach((email)=> add_to_mailbox(email));
		}
	});
}
function add_to_mailbox(email){
	//New elements 
	const div = document.createElement('div');
	const tm = document.createElement('div');
	const sub = document.createElement('div');
	const from = document.createElement('div');
	const a = document.createElement('a');
	//const archive_button = document.createElement('button');
	
	//define elements class
	div.className = 'row border p-2';
	from.className = 'col-lg-3 col-sm-12';
	sub.className = 'col-lg-6 col-sm-12';
	tm.className = 'col-lg-3 col-sm-12';
	a.className = 'card-link m-0';
	//archive_button.className = 'btn btn-sm btn-outline-primary float-right';
	
	//define content and additional style to elements
	/*
	archive_button.innerHTML = '<i class="fas fa-archive"></i>';
	archive_button.title = 'Archive';
	
	archive_button.addEventListener('click', (archive_button) => {
		read_archive(email.id, 'archived', true);
		return (load_mailbox('inbox'));
	}); */
	a.href = '#';
	a.addEventListener('click', () => getEmail(email.id));
	tm.innerHTML = email.timestamp;
	tm.style.color = '#686868'
	sub.innerHTML = email.subject;
	from.innerHTML = "<strong>"+email.sender+"</strong>";
	if (email.read) {
		div.style.backgroundColor = '#D8D8D8';
	}else{
		div.style.backgroundColor = 'white';
	}
	
	//add elements to their parent element
	a.append(div);
	//tm.append(archive_button);
	div.append(from);
	div.append(sub);
	div.append(tm);
	document.querySelector('#emails-view').append(a);
}
function getEmail(email_id){
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#email-content').style.display = 'block';
	
	fetch(`/emails/${email_id}`)
	.then(response => response.json())
	.then(email => {
		// Print email
		console.log(email);
		//clear view
		document.querySelector('#email-content').innerHTML = '';
		
		if (email.error != undefined){
			return alert(email.error);
		}else{
			//mark email as read
			read_archive(email.id,'read', true);
			
			// new elements
			const reply = document.createElement('button');
			const archive = document.createElement('button');
			const eheader = document.createElement('div');
			const ebody = document.createElement('div');
			
			//elements' classes and contents
			reply.className = 'btn btn-sm btn-outline-primary float-right m-1';
			archive.className = 'btn btn-sm btn-outline-primary float-right m-1';
			reply.value='reply';
			archive.value='archive';
			reply.innerHTML='Reply';
			archive.innerHTML='Archive';
			eheader.innerHTML = `<strong>From:</strong> ${email.sender}<br> 
				<strong>To: </strong>${email.recipients}<br> 
				<strong>Subject: </strong> ${email.subject}<br>
				<strong>Timestamp: </strong> ${email.timestamp}<br>`;
			ebody.innerHTML = `<hr>${email.body}`
			
			//add elements to parent element
			document.querySelector('#email-content').append(reply);
			document.querySelector('#email-content').append(archive);
			document.querySelector('#email-content').append(eheader);
			document.querySelector('#email-content').append(ebody);
			
		}	
	});
	return false;
	
}
function read_archive(email_id, pname, st){
	if (pname === 'archived'){
		fetch(`/emails/${email_id}`, {
			method: 'PUT',
			body: JSON.stringify({
				archived : st
			})
		});
	}
	else if (pname === 'read'){
		fetch(`/emails/${email_id}`, {
			method: 'PUT',
			body: JSON.stringify({
				read : st
			})
		});
	}
	else {
		return console.log(`could not set email #${email_id}.${pname} to ${st} because '${pname}' is not a valid property.`);		
	}
	return console.log(`email #${email_id}.${pname} set to ${st}.`);
}