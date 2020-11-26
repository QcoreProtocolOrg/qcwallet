console.log('QC Wallet is installed.');

const injectInteractionScript = file => {
	let script = document.createElement('script');
	script.src = chrome.extension.getURL(file);
	(document.head||document.documentElement).appendChild(script);
	script.onload = () => script.remove();
}

injectInteractionScript('integration/inpage/index.js');

const port = chrome.runtime.connect({name: 'qc-port'});
// Message from background
port.onMessage.addListener(message => {
	console.log(message);
	// forward the message from background to SDK
	window.postMessage({
		route: { wallet: 'qtum', source: 'contentscript', target: 'SDK' },
		data: message.data
	}, '*');
});

// Message from SDK
window.addEventListener('message', message => {
	const { data } = message;
	if (!data.route || data.route.wallet !== 'qtum'
		|| data.route.source !== 'SDK'
		|| data.route.target !== 'contentscript') {
		return;
	}

    // forward the message from SDK to background
	port.postMessage({
		route: { wallet: 'qtum', source: 'contentscript', target: 'background' },
		data: data.data
	})
});