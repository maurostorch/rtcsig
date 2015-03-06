var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

function rtcpeer(){
	this.messageListners = [];
	this.channelList = {};
	this.candidates = [];
}
rtcpeer.prototype = {
	constructor: rtcpeer,
	dataChannelOptions : {
	//	ordered: false, // do not guarantee order
	//	maxRetransmitTime: 3000, // in milliseconds
		reliable: false
	},
	configuration : {
	  'iceServers': [
		//{'url':'turn:numb.viagenie.ca','credential':'1q2w3e4r','username':'mauro@storchlab.com'},
		//{ 'url': 'stun:stunserver.org'},
		//{ 'url': 'stun:stun.ekiga.net'},
		//{ 'url': 'stun:stun.schlund.de'},
		//{ 'url': 'stun:stun3.l.google.com:19302'},
		{ 'url': 'stun:stun.l.google.com:19302'}
		]
	},
	options : {
	    optional: [
		{DtlsSrtpKeyAgreement: true},
		{RtpDataChannels: true}
		]
	},
	mediaConstraints : {'mandatory':{
		'OfferToReceiveAudio':false,
		'OfferToReceiveVideo':false
		}
	},
	messageListners : undefined,
	channelList : undefined,
	pc : undefined,
	errorHandler : function(err){
		console.log("Error:"); console.log(err);
		console.log(new Error('dummy').stack);
	},
	init : function(callback){ //the callback is called for every icecandidate
		//this.pc = new PeerConnection(this.configuration,this.options);
		this.pc = new PeerConnection(null);
		var that = this;
		this.pc.ondatachannel = function(event){
			that.handleChannel(event.channel);
		};
		this.pc.onicecandidate = function(event) {
			if (event.candidate) {
				console.log("candidate: "+JSON.stringify(event.candidate));
				that.candidates.push(JSON.stringify(event.candidate));
				//if (JSON.parse(that.localDesc).type == 'offer')
					callback(that.localDesc,event.candidate);
				//else
				//	callback(that.remoteDesc,event.candidate);
			}
		};
	},
	candidates: undefined,
	offerCon :function(callback){
		if (!this.mainChannel)
			this.createChannel('COPY_PASTE_CHANNEL');
		var that = this;
		this.pc.createOffer(function(desc) {
			that.localDesc = JSON.stringify(desc);
			callback(JSON.stringify(desc));
			that.pc.setLocalDescription(desc,function(e){},that.errorHandler);
		}, this.errorHandler, this.mediaConstraints);
	},
	handleMessage: function(msg){
		for (var i=0;i<this.messageListners.length;i++){
			var l = this.messageListners[i];
			l(msg);
		}
	},
	addMessageListner: function(f){
		this.messageListners.push(f);
	},
	createChannel: function(name){
		this.handleChannel(undefined,name);
		//return this.handleChannel(null,name);
	},
	handleChannel: function(channel, channelName){
		if (!channelName) channelName = "CHANNEL_NAME";
		if (!channel){
			channel = this.pc.createDataChannel(channelName, this.dataChannelOptions);
			this.channelList[channelName] = channel;
		} else{
			if (this.channelList.length == 0)
				this.mainChannel = channelName;
			this.channelList[channelName] = channel;
		}
		var that = this;
		channel.onopen = function(event) {
			console.log("dataChannel opened");
			console.log(channel);
		};
		channel.onerror = this.errorHandler;
		channel.onmessage = function(event){
			//console.log(event);
			that.handleMessage(event.data);
		}
		channel.onclose = function(event){
			console.log("dataChannel is closed.");
			console.log(event);
			// TODO remove channel
		}
		return channel;
	},
	sendMessage: function(msg,channelName){
		if (channelName == 'broadcast') channelName = undefined;
		if(channelName){
			var c = this.channelList[channelName];
			var readyState = c.readyState;
			if (readyState == "open") {
				c.send(msg);
			}else{
				console.warn("dataChannel could not send message, state:"+readyState);
			}
		} else {
			var key;
			for (key in this.channelList){
				var c = this.channelList[key];
				var readyState = c.readyState;
				try{
					c.send(msg);
				} catch(err) {
					console.warn('dataChannel could not send message, state:'+readyState);
					console.err(err);
				}
			}
		}
	},
	localDesc: undefined,
	answer: function(ta, callback){
		try{
			if(!ta) {
				ta = document.getElementById('textarea').value;
				document.getElementById('textarea').value='';
			}
			this.remoteDesc = ta;
			var desc = new SessionDescription(JSON.parse(ta));
			//console.log(desc);
			var that = this;
			this.pc.setRemoteDescription(desc,function (){
					that.pc.createAnswer(function(desc) {
						that.localDesc = JSON.stringify(desc);
						callback(that.localDesc);
						that.pc.setLocalDescription(desc);
					},that.errorHandler,that.mediaConstraints);
				},this.errorHandler);
		} catch (e) {console.log(e);}
	},
	remoteDesc: undefined,
	offer: function(ta){
		if(!ta) {
			ta = document.getElementById('textarea').value;
			document.getElementById('textarea').value='';
		}
		this.remoteDesc = ta;
		var desc = new SessionDescription(JSON.parse(ta));
		this.pc.setRemoteDescription(desc,function(){console.log("done");},this.errorHandler);
	},
	cand : function(ta){
		this.pc.addIceCandidate(new IceCandidate(JSON.parse(ta)));
	}
}
function rtcnode(){}
rtcnode.prototype = {
	constructor: rtcnode,
	localPeers: [],
	remotePeers: [],
	messageListners: [],
	init: function(){
		this.searchForNewPeers();
		var that = this;
		//setTimeout(function(){that.searchForAnswers();},500);
		setTimeout(function(){
			if(that.remotePeers.length == 0){
				that.offerNewPeer();
				//setTimeout(function(){that.searchForCandidates();},3000);
			}
		},3000);
		//setTimeout(function(){that.searchForCandidates();},1500);
	},
	offerNewPeer: function(node){
		console.log('--- offering a new peer ----');
		var newpeer = new rtcpeer()
		newpeer.init(function(localDesc, candidate){
			if (candidate != undefined){
				$.ajax({
					url: '/rtcsig/candidate',
					data: 'desc='+localDesc+'&candidate='+JSON.stringify(candidate)+'&csrfmiddlewaretoken='+getCookie('csrftoken'),
					type: 'POST',
					success: function(d){},
					error: function(x,s,e){console.log(x);console.log(s);console.log(e);}
				});
			}
		});
		var that = this;
		newpeer.addMessageListner(function(msg){
			for (var i=0;i<that.messageListners.length;i++){
				var l = that.messageListners[i];
				l(msg);
			}
		});
		newpeer.offerCon(function(desc){
			$.ajax({
				url: '/rtcsig/offer',
				data: 'offerdesc='+desc+'&csrfmiddlewaretoken='+getCookie('csrftoken'),
				type: 'POST',
				success: function(d){
					setTimeout(function(){that.searchForAnswers();},3000);
				},
				error: function(x,s,e){}
			});
		});
		this.localPeers.push(newpeer);
		this.lastestLocal = newpeer;
	},
	answerNewPeer: function(offerDesc){
		var newpeer = new rtcpeer()
		console.log('new peer remote:');
		newpeer.init(function(localDesc,candidate){
			if (candidate != undefined){
				$.ajax({
					url: '/rtcsig/candidate',
					data: 'desc='+localDesc+'&candidate='+JSON.stringify(candidate)+'&csrfmiddlewaretoken='+getCookie('csrftoken'),
					type: 'POST',
					success: function(d){},
					error: function(x,s,e){}
				});
			}
		});
		var that = this;
		newpeer.addMessageListner(function(msg){
			console.log(that.messageListners);
			for (var i=0;i<that.messageListners.length;i++){
				var l = that.messageListners[i];
				l(msg);
			}
		});
		newpeer.answer(offerDesc,function(desc){
			$.ajax({
				url: '/rtcsig/answer',
				data: 'desc='+offerDesc+'&answers='+desc+'&csrfmiddlewaretoken='+getCookie('csrftoken'),
				type: 'POST',
				success: function(d){
					console.log(newpeer);
					setTimeout(function(){that.searchForCandidates();},2000);
					//if (that.localPeers != undefined || that.localPeers.length > 0)
					//	setTimeout(function(){that.searchForAnswers();},2000);
				},
				error: function(x,s,e){}
			});
		});
		that.remotePeers.push(newpeer);
	},
	searchForNewPeers: function(){
		var that = this;
		var o = '';
		for (var i=0;i<that.localPeers.length;i++) o = o + that.localPeers[i].localDesc;
		for (var i=0;i<that.remotePeers.length;i++) o = o + that.remotePeers[i].localDesc;
		if (o == '') o = 'firstcall';
		$.ajax({
			url: '/rtcsig/offer',
			data: 'offerdesc='+o+'&csrfmiddlewaretoken='+getCookie('csrftoken'),
			success: function(data){
				var hasme = false;
				for (var i=0;i<data.length;i++){
					var isme = false;
					for(var j=0;j<that.localPeers.length;j++){
						if (data[i] == that.localPeers[j].localDesc){
							isme = true; //if offer in signaling server if my, ignore
						}
					}
					if (!isme){
						that.answerNewPeer(JSON.stringify(data[i]));
					} else
						hasme = true;
				}
				//if (hasme)
				//	setTimeout(function(){that.searchForNewPeers();},3000);
				//else
				//	that.offerNewPeer();
			},
			error: function(xhr,status,error){
				console.log(xhr);
				console.log(xhr.responseText);
			}
		});
	},
	searchForAnswers: function(){
		var that = this;
		var p = this.lastestLocal;
		var shouldcreate = true;
		$.ajax({
			url: '/rtcsig/answer',
			data: 'desc='+p.localDesc+'&csrfmiddlewaretoken='+getCookie('csrftoken'),
			success: function(d){
				if (d.length > 0){
					console.log(p);
					if (p != undefined && p.pc.iceConnectionState == 'new'){
						shouldcreate = false;
						console.log('--- answers found ---');
						console.log(JSON.stringify(d));
						p.offer(JSON.stringify(d[0]));
						//setTimeout(function(){that.offerNewPeer();},900);
						setTimeout(function(){that.searchForCandidates();},1000);
					}
				} else
					setTimeout(function(){that.searchForAnswers();},3000);
			},
			error: function(x,s,e){
				console.log(s);
				setTimeout(function(){that.searchForAnswers();},3000);
			}
		});
	},
	searchForCandidates: function(){
		var that = this;
		var p; var l = [];
		for (var i=0;i<this.localPeers.length;i++)l.push(this.localPeers[i]);
		for (var i=0;i<this.remotePeers.length;i++)l.push(this.remotePeers[i]);
		for (var i=0;i<l.length;i++){
			p = l[i];
			if (p.remoteDesc)
			if (p.pc.iceConnectionState == 'new'
				|| p.pc.iceConnectionState == 'connected'
				|| p.pc.iceConnectionState == 'checking'){
				//console.log('> new peer searching for candidates')
				$.ajax({
					url: '/rtcsig/candidate',
					data: 'desc='+p.remoteDesc+'&csrfmiddlewaretoken='+getCookie('csrftoken'),
					success: function(d){
						for(var i=0;i<d.length;i++){
							console.log('new candidate found:'+JSON.stringify(d[i]));
							p.cand(JSON.stringify(d[i]));
						}
						if (!d || d.length == 0){
							setTimeout(function(){that.searchForCandidates();},3000);
						}
					},
					error: function(x,s,e){console.log(e);console.log(x);}
				});
			}
		}
	},
	addMessageListner: function(f){
		if(!this.messageListners)
			this.messageListners = [];
		this.messageListners.push(f);
	},
	handleMessage: function(msg){
		for (var i=0;i<this.messageListners.length;i++){
			var l = this.messageListners[i];
			l(msg);
		}
	},
	sendMessage: function(msg, channelName){
		for (var i=0;i<this.localPeers.length;i++){
			this.localPeers[i].sendMessage(msg,channelName);
		}
		for (var i=0;i<this.remotePeers.length;i++){
			this.remotePeers[i].sendMessage(msg,channelName);
		}
	}
}
