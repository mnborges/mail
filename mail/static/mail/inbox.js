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
	 history.pushState({page : document.querySelector('#compose').dataset.page}, '' , '#compose?new');
	 compose_email();
	});
		
	// By default, load the inbox
	load_mailbox('inbox');
	
	// console.log() were commented
});



//enable history navegation
window.onpopstate = function(event) {
    //console.log(event.state.page);
	const page = event.state.page;
	if (page === 'compose'){
		compose_email();
	}else if (page === 'inbox' || page === 'archive' || page === 'sent'){
		load_mailbox(`${page}`);
	}else if(page.substring(0,5) === 'email'){
		getEmail(page.substring(6,));
	}else if(page.substring(0,5) === 'reply'){
		const reply = page.substring(6,);
		fetch(`/emails/${reply}`)
		.then(response => response.json())
		.then(email => {compose_email(email)});
	}
}
function compose_email(reply) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields...
  if(!reply){
	  document.querySelector('#compose-recipients').value = '';
	  document.querySelector('#compose-subject').value = '';
	  document.querySelector('#compose-body').value = '';
  } // ...or pre-fill with email to be replied
  else{
		document.querySelector('#compose-recipients').value = reply.sender;
		if(reply.subject.substring(0,3) != 'Re:') document.querySelector('#compose-subject').value = `Re: ${reply.subject}`;
		else  document.querySelector('#compose-subject').value = reply.subject;
		document.querySelector('#compose-body').value = `\n\nOn ${reply.timestamp} ${reply.sender} wrote:\n${reply.body}` ;
  }	
  
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
				//console.log(`${result.error}`);
				alert(`${result.error}`);
			}else{
				//console.log(`${result.message}`);
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
		//console.log(emails);
		if (emails.error != undefined){
			return alert(emails.error);
		}else {
			emails.forEach((email)=> add_to_mailbox(email, mailbox));
		}
	});
	return false;
}
function add_to_mailbox(email, mailbox){
	//New elements 
	const div = document.createElement('div');
	const tm = document.createElement('div');
	const sub = document.createElement('div');
	const from = document.createElement('div');
	const archive_button = document.createElement('button');
	const read_button = document.createElement('button');
	
	//animation to change background color when mark email as read/unread
	var fwtg = new Animation( new KeyframeEffect(div, 
		[ 
			{backgroundColor: "white"}, 
			{backgroundColor: "#D8D8D8"} 
		], 
		{duration: 1000, fill: 'forwards'}),
		document.timeline);
		
	//define elements' classes
	div.className = 'row border p-2 pointer';
	from.className = 'col-lg-3 col-sm-12';
	sub.className = 'col-lg-6 col-sm-12';
	tm.className = 'col-lg-3 col-sm-12';
	archive_button.className = 'btn btn-sm btn-outline-primary pt-0 pb-0 float-right m-1';
	read_button.className = archive_button.className;
	
	//define content and additional style to elements
	div.setAttribute('data-page', `email=${email.id}`); 
	div.style.animationPlayState = 'paused';
	archive_button.innerHTML = "<i class='fas fa-archive'></i>";
	archive_button.style.display = 'none';
	read_button.style.display = 'none';
	
	if (!email.archived) archive_button.title = 'Archive';
	else archive_button.title = 'Unarchive';
	
	tm.innerHTML = email.timestamp;
	tm.style.color = '#686868'
	sub.innerHTML = email.subject;
	from.innerHTML = "<strong>"+email.sender+"</strong>";
	if (email.read) {
		read_button.innerHTML = "<i class='far fa-envelope'></i>";
		read_button.title = 'Mark as unread';
		div.style.backgroundColor = '#D8D8D8';
	}else{
		read_button.innerHTML = "<i class='far fa-envelope-open'></i>";
		read_button.title = 'Mark as read';
		div.style.backgroundColor = 'white';
	}
	//add elements to their parent element
	div.append(from);
	div.append(sub);
	div.append(tm);
	document.querySelector('#emails-view').append(div);
	
	//append buttons only to inbox and archive mailbox
	if (mailbox != 'sent') {
		tm.append(archive_button);
		tm.append(read_button);
	}
	
	//show archive and read icons only when mouse is over the div
	div.addEventListener('mouseover', () => {
		archive_button.style.display = 'block';
		read_button.style.display = 'block';
	});
	div.addEventListener('mouseout', () => {
		archive_button.style.display = 'none';
		read_button.style.display = 'none';
	});
	
	// trigger event to show email content
	div.addEventListener('click', () => {
		history.pushState({page: div.dataset.page}, '' ,`#email=${email.id}`);
		getEmail(email.id);
	}); 
	
	//event to archive/unarchive email
	archive_button.addEventListener('click', (event) => {
		if (!event) event = window.event;
		event.stopPropagation(); //dont trigger div click event
		read_archive(email.id, 'archived', !email.archived);
		const fade = div.getAnimations()[0]; //animation declared in the .css file
		fade.play();
		fade.onfinish = () => load_mailbox('inbox');
	});
	//event to mark email as read/unread 
	read_button.addEventListener('click', (event) => {
		if (!event) event = window.event;
		event.stopPropagation(); //dont trigger div click event
		if (!email.read){
			read_archive(email.id, 'read', true);
			fwtg.play();
		} 
		else{
			read_archive(email.id, 'read', false);
			fwtg.reverse();
		}
		fwtg.onfinish = () => load_mailbox(mailbox);
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
		//console.log(email);
		
		//clear view
		document.querySelector('#email-content').innerHTML = '';
		
		if (email.error != undefined){
			return alert(email.error);
		}else{
			
			//mark email as read
			if (!email.read) read_archive(email.id,'read', true);
			
			// new elements
			const reply = document.createElement('button');
			const archive = document.createElement('button');
			const eheader = document.createElement('div');
			const bd = document.createElement('div');
			const ebody = document.createElement('pre');
			bd.append(ebody);
			//elements' classes and contents
			reply.className = 'btn btn-sm btn-outline-primary float-right m-1';
			archive.className = 'btn btn-sm btn-outline-primary float-right m-1';
			reply.value='reply';
			reply.setAttribute('data-page', `reply=${email.id}`); 
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
			document.querySelector('#email-content').append(bd);
			
			//archive button => change email property and reload page
			archive.addEventListener('click', (event) => {
					read_archive(email.id, 'archived', !email.archived);
					//disable button till page gets reloaded
					archive.style.cursor = 'wait';
					archive.disabled=true;
					setTimeout(function () { getEmail(email.id) }, 750); 
			});
			
			//reply => compose email with pre-filled info
			reply.addEventListener('click', () => {	
				history.pushState({page : reply.dataset.page}, '' , `#compose?reply=${email.id}`);
				compose_email(email);
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
	/* remove comments to debug */
	else {
		//console.log(`could not set email #${email_id}.${pname} to ${st} because '${pname}' is not a valid property.`);	
	}
	//console.log(`email #${email_id}.${pname} set to ${st}.`);
	return false
}