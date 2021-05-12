document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => {
	  history.pushState({page : document.querySelector('#inbox').dataset.page}, '' , '#inbox'); //update url
	  load_mailbox('inbox');
  });
  document.querySelector('#sent').addEventListener('click', () =>{
	  history.pushState({page : document.querySelector('#sent').dataset.page}, '' , '#sent');
	  load_mailbox('sent');
  });
  document.querySelector('#archive').addEventListener('click', () =>{
	  history.pushState({page : document.querySelector('#archive').dataset.page}, '' , '#archive');
	  load_mailbox('archive');
  });
  document.querySelector('#compose').addEventListener('click', () => {
	 history.pushState({page : document.querySelector('#compose').dataset.page}, '' , '#compose');
	 compose_email();
  });
	
  // By default, load the inbox
  load_mailbox('inbox');
});
window.onpopstate = function(event) {
    //console.log(event.state.page);
	const page = event.state.page;
	if (page === 'compose'){
		compose_email();
	}else if (page === 'inbox' || page === 'archive' || page === 'sent'){
		load_mailbox(`${page}`);
	}else{
		getEmail(event.state.page);
	}
}
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
			emails.forEach((email)=> add_to_mailbox(email, mailbox));
		}
	});
}
function add_to_mailbox(email, mailbox){
	//New elements 
	const div = document.createElement('div');
	const tm = document.createElement('div');
	const sub = document.createElement('div');
	const from = document.createElement('div');
	const archive_button = document.createElement('button');
	
	//define elements class
	div.className = 'row border p-2 pointer';
	from.className = 'col-lg-3 col-sm-12';
	sub.className = 'col-lg-6 col-sm-12';
	tm.className = 'col-lg-3 col-sm-12';
	archive_button.className = 'btn btn-sm btn-outline-primary pt-0 pb-0 float-right';
	
	//define content and additional style to elements
	div.setAttribute('data-page', `email${email.id}`); 
	div.style.animationPlayState = 'paused';
	archive_button.innerHTML = "<i class='fas fa-archive'></i>";
	archive_button.style.display = 'none';
	if (mailbox === 'inbox'){
		archive_button.title = 'Archive';
	}else{
		archive_button.title = 'Unarchive';
	}
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
	div.append(from);
	div.append(sub);
	div.append(tm);
	document.querySelector('#emails-view').append(div);
	
	//show archive icon only when mouse is over the div
	if (mailbox != 'sent') tm.append(archive_button);
	div.addEventListener('mouseover', () => {
		archive_button.style.display = 'block';
	});
	div.addEventListener('mouseout', () => {
		archive_button.style.display = 'none';
	});
	
	// trigger event to show email content
	div.addEventListener('click', () => {
		history.pushState({page: div.dataset.page}, '' ,`#email=${email.id}`);
		getEmail(email.id);
	}); 
	
	//trigger event to archive mail
	archive_button.addEventListener('click', (event) => {
		if (!event) event = window.event;
		event.stopPropagation(); //dont trigger div click event
		if (mailbox === 'inbox') read_archive(email.id, 'archived', true);
		if (mailbox === 'archive') read_archive(email.id, 'archived', false);
		div.style.animationPlayState = 'running';
		div.onanimationend = () => load_mailbox('inbox');
	});
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
			if (!email.archived) archive.innerHTML='Archive';
			else archive.innerHTML='Unarchive';
			
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
			
			archive.addEventListener('click', (event) => {
				//let e;
				if (email.archived){
					//e = read_archive(email.id, 'archived', false);
					read_archive(email.id, 'archived', false);
					console.log('unarchived');
				
				} 
				else {
					//e = read_archive(email.id, 'archived', true);
					read_archive(email.id, 'archived', true);
					console.log('archived');
				}
				//history.go(0); //RELOAD EMAIL
				//location.reload();
			});
			
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