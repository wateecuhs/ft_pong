function getCodeFromUrl() {
	const queryParams = new URLSearchParams(window.location.search);
	const code = queryParams.get('code');
	return code;
}

function	loginAuth(code){
	fetch(`/auth/42/callback?code=${code}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({code})
	}).then(response => {
		console.log("here");
		if (!response.ok) {
			throw new Error('Error logging in');
		}
		return response.json();
	}).then(data => {
		console.log(data);
		window.location.href = "http://127.0.0.1:5000/home"
	})
}

window.onload = function(){
	const code = getCodeFromUrl();
	console.log(code);
	if (code !== null) {
		loginAuth(code);
	}
}